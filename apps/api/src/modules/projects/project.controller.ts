import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../../database/connection';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/AppError';
import { successResponse, asyncHandler } from '../../middleware/errorHandler';

const PLOT_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#22c55e',
  HOLD:      '#eab308',
  BOOKED:    '#f97316',
  SOLD:      '#ef4444',
  BLOCKED:   '#94a3b8',
};

function getDefaultPlotColor(status: string): string {
  return PLOT_STATUS_COLORS[status] ?? '#3b82f6';
}

// Public: List Projects
export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20', status, search } = req.query;
  let sql = 'SELECT * FROM projects WHERE deleted_at IS NULL';
  const params: any[] = [];
  if (status) { params.push(status); sql += ` AND status = \$${params.length}`; }
  if (search) { params.push(`%${search}%`); sql += ` AND name ILIKE \$${params.length}`; }
  sql += ` ORDER BY created_at DESC LIMIT \$${params.length + 1}`;
  params.push(parseInt(limit as string, 10));
  const projects = await query(sql, params);
  res.json({ success: true, data: projects });
});

// Public: Get Project Details by Slug
export const getProjectDetails = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const project = await queryOne('SELECT * FROM projects WHERE slug = $1 AND deleted_at IS NULL', [slug]);
  if (!project) throw new NotFoundError('Project not found');
  const phases = await query('SELECT * FROM project_phases WHERE project_id = $1 ORDER BY order_index ASC', [project.id]);
  const plots = await query('SELECT * FROM project_plots WHERE project_id = $1 ORDER BY plot_number ASC', [project.id]);
  res.json({ success: true, data: { ...project, phases, plots } });
});

// Public: Get Project Map Payload
export const getProjectMap = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const project = await queryOne<{ id: string }>('SELECT id, name, slug FROM projects WHERE slug = $1 AND deleted_at IS NULL', [slug]);
  if (!project) throw new NotFoundError('Project not found');
  const phases = await query('SELECT * FROM project_phases WHERE project_id = $1 ORDER BY order_index ASC', [project.id]);
  const plots = await query('SELECT * FROM project_plots WHERE project_id = $1 ORDER BY plot_number ASC', [project.id]);
  const mapObjects = await query('SELECT * FROM map_objects WHERE project_id = $1 ORDER BY type ASC', [project.id]);
  const clusters = await query('SELECT * FROM plot_clusters WHERE project_id = $1', [project.id]);
  const publishedVersion = await queryOne("SELECT * FROM project_map_versions WHERE project_id = $1 AND status = 'PUBLISHED' ORDER BY version_number DESC LIMIT 1", [project.id]);
  res.json({
    success: true,
    data: {
      project,
      phases,
      plots: plots.map((p: any) => ({ ...p, effective_color: p.display_color || getDefaultPlotColor(p.status) })),
      mapObjects,
      clusters,
      publishedVersion,
    },
  });
});

// Admin: Create Project
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, developer, status, total_plots, total_area, city, state, address, latitude, longitude, google_maps_link } = req.body;
  const parseCoord = (v: any) => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v);
  const latVal = parseCoord(latitude);
  const lngVal = parseCoord(longitude);

  const [project] = await query(
    `INSERT INTO projects (name, slug, description, developer, status, total_plots, total_area, city, state, address, latitude, longitude, google_maps_link, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [name, slug, description, developer, status || 'UPCOMING', total_plots || 0, total_area, city, state, address, latVal, lngVal, google_maps_link, req.user?.userId],
  );
  res.status(201).json({ success: true, data: project });
});

// Admin: Update Project
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, developer, status, total_plots, total_area, city, state, address, latitude, longitude, google_maps_link } = req.body;
  const project = await queryOne('SELECT id FROM projects WHERE id = $1', [id]);
  if (!project) throw new NotFoundError('Project not found');

  const parseCoord = (v: any) => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v);
  const latVal = parseCoord(latitude);
  const lngVal = parseCoord(longitude);

  const [updated] = await query(
    `UPDATE projects SET name=COALESCE($1,name), slug=COALESCE($2,slug), description=COALESCE($3,description), developer=COALESCE($4,developer), status=COALESCE($5,status), total_plots=COALESCE($6,total_plots), total_area=COALESCE($7,total_area), city=COALESCE($8,city), state=COALESCE($9,state), address=COALESCE($10,address), latitude=COALESCE($11,latitude), longitude=COALESCE($12,longitude), google_maps_link=COALESCE($13,google_maps_link), updated_at=NOW() WHERE id=$14 RETURNING *`,
    [name, slug, description, developer, status, total_plots, total_area, city, state, address, latVal, lngVal, google_maps_link, id],
  );
  res.json({ success: true, data: updated });
});

// Admin: Delete Project
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await queryOne('SELECT id FROM projects WHERE id = $1', [id]);
  if (!project) throw new NotFoundError('Project not found');

  // Because all foreign keys (project_images, project_phases, project_plots, plot_clusters, map_objects, project_map_versions) 
  // are created with ON DELETE CASCADE, deleting the project will automatically delete all related photo and map data.
  await query('DELETE FROM projects WHERE id = $1', [id]);
  
  res.json({ success: true, message: 'Project and all related data deleted successfully' });
});

// Admin: Get Project by ID
export const getProjectByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  
  const project = isUuid 
    ? await queryOne('SELECT * FROM projects WHERE id = $1', [id])
    : await queryOne('SELECT * FROM projects WHERE slug = $1', [id]);

  if (!project) throw new NotFoundError('Project not found');

  const projectId = project.id;
  const phases = await query('SELECT * FROM project_phases WHERE project_id = $1 ORDER BY order_index ASC', [projectId]);
  const plots = await query('SELECT * FROM project_plots WHERE project_id = $1 ORDER BY plot_number ASC', [projectId]);
  const mapObjects = await query('SELECT * FROM map_objects WHERE project_id = $1', [projectId]);
  const clusters = await query('SELECT * FROM plot_clusters WHERE project_id = $1', [projectId]);
  res.json({ success: true, data: { ...project, phases, plots, mapObjects, clusters } });
});

// Phases
export const createPhase = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { name, description, order_index, status } = req.body;
  const [phase] = await query(
    `INSERT INTO project_phases (project_id, name, description, order_index, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [projectId, name, description, order_index ?? 0, status ?? 'PLANNED'],
  );
  res.status(201).json({ success: true, data: phase });
});

export const updatePhase = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, phaseId } = req.params;
  const { name, description, order_index, status } = req.body;
  const [updated] = await query(
    `UPDATE project_phases SET name=COALESCE($1,name), description=COALESCE($2,description), order_index=COALESCE($3,order_index), status=COALESCE($4,status), updated_at=NOW() WHERE id=$5 AND project_id=$6 RETURNING *`,
    [name, description, order_index, status, phaseId, projectId],
  );
  if (!updated) throw new NotFoundError('Phase not found');
  res.json({ success: true, data: updated });
});

export const deletePhase = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, phaseId } = req.params;
  const plots = await query('SELECT id FROM project_plots WHERE phase_id = $1 LIMIT 1', [phaseId]);
  if (plots.length > 0) throw new BadRequestError('Cannot delete phase with existing plots.');
  await query('DELETE FROM project_phases WHERE id = $1 AND project_id = $2', [phaseId, projectId]);
  res.json({ success: true, message: 'Phase deleted successfully' });
});

// Map Objects
export const createMapObject = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { phase_id, type, name, geometry, display_style, metadata } = req.body;
  if (!geometry) throw new BadRequestError('Geometry is required');
  const [obj] = await query(
    `INSERT INTO map_objects (project_id, phase_id, type, name, geometry, display_style, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [projectId, phase_id ?? null, type, name ?? null, JSON.stringify(geometry), display_style ? JSON.stringify(display_style) : null, metadata ? JSON.stringify(metadata) : null],
  );
  res.status(201).json({ success: true, data: obj });
});

export const updateMapObject = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, objectId } = req.params;
  const { phase_id, type, name, geometry, display_style, metadata } = req.body;
  const [updated] = await query(
    `UPDATE map_objects SET phase_id=COALESCE($1,phase_id), type=COALESCE($2,type), name=COALESCE($3,name), geometry=COALESCE($4,geometry), display_style=COALESCE($5,display_style), metadata=COALESCE($6,metadata), updated_at=NOW() WHERE id=$7 AND project_id=$8 RETURNING *`,
    [phase_id, type, name, geometry ? JSON.stringify(geometry) : null, display_style ? JSON.stringify(display_style) : null, metadata ? JSON.stringify(metadata) : null, objectId, projectId],
  );
  if (!updated) throw new NotFoundError('Map object not found');
  res.json({ success: true, data: updated });
});

export const deleteMapObject = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, objectId } = req.params;
  const deleted = await query('DELETE FROM map_objects WHERE id = $1 AND project_id = $2 RETURNING id', [objectId, projectId]);
  if (deleted.length === 0) throw new NotFoundError('Map object not found');
  res.json({ success: true, message: 'Map object deleted' });
});

// Plots
export const createPlot = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { phase_id, cluster_id, plot_number, area, area_unit, width, length, price, price_type, facing, status, display_color, description, geometry } = req.body;
  const [plot] = await query(
    `INSERT INTO project_plots (project_id, phase_id, cluster_id, plot_number, area, area_unit, width, length, price, price_type, facing, status, display_color, description, polygon_geometry)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (project_id, plot_number) DO UPDATE SET
       phase_id=EXCLUDED.phase_id, cluster_id=EXCLUDED.cluster_id, area=EXCLUDED.area, area_unit=EXCLUDED.area_unit,
       width=EXCLUDED.width, length=EXCLUDED.length, price=EXCLUDED.price, price_type=EXCLUDED.price_type,
       facing=EXCLUDED.facing, status=EXCLUDED.status, display_color=EXCLUDED.display_color,
       description=EXCLUDED.description, polygon_geometry=EXCLUDED.polygon_geometry, updated_at=NOW()
     RETURNING *`,
    [projectId, phase_id ?? null, cluster_id ?? null, plot_number, area, area_unit ?? 'SQ_FT', width ?? null, length ?? null, price, price_type ?? 'FIXED', facing ?? null, status ?? 'AVAILABLE', display_color ?? null, description ?? null, geometry ? JSON.stringify(geometry) : null],
  );
  res.status(201).json({ success: true, data: plot });
});

export const updatePlot = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, plotId } = req.params;
  const { phase_id, cluster_id, plot_number, area, area_unit, width, length, price, price_type, facing, status, display_color, description, geometry } = req.body;
  const existing = await queryOne<{ status: string }>('SELECT status FROM project_plots WHERE id = $1 AND project_id = $2', [plotId, projectId]);
  if (!existing) throw new NotFoundError('Plot not found');
  if (geometry !== undefined && existing.status === 'SOLD') {
    await query(`INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_data) VALUES (gen_random_uuid(),$1,'SOLD_PLOT_GEOMETRY_CHANGED','project_plot',$2,$3)`, [req.user?.userId, plotId, JSON.stringify({ warning: 'Geometry changed on SOLD plot' })]);
  }
  const [updated] = await query(
    `UPDATE project_plots SET
      phase_id=COALESCE($1,phase_id), cluster_id=COALESCE($2,cluster_id), plot_number=COALESCE($3,plot_number),
      area=COALESCE($4,area), area_unit=COALESCE($5,area_unit), width=COALESCE($6,width), length=COALESCE($7,length),
      price=COALESCE($8,price), price_type=COALESCE($9,price_type), facing=COALESCE($10,facing),
      status=COALESCE($11,status), display_color=COALESCE($12,display_color), description=COALESCE($13,description),
      polygon_geometry=COALESCE($14,polygon_geometry), updated_at=NOW()
     WHERE id=$15 AND project_id=$16 RETURNING *`,
    [phase_id, cluster_id, plot_number, area, area_unit, width, length, price, price_type, facing, status, display_color, description, geometry ? JSON.stringify(geometry) : null, plotId, projectId],
  );
  res.json({ success: true, data: updated });
});

export const deletePlot = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, plotId } = req.params;
  const existing = await queryOne<{ status: string }>('SELECT status FROM project_plots WHERE id = $1 AND project_id = $2', [plotId, projectId]);
  if (!existing) throw new NotFoundError('Plot not found');
  if (existing.status === 'SOLD') throw new ForbiddenError('Cannot delete a SOLD plot.');
  await query('DELETE FROM project_plots WHERE id = $1 AND project_id = $2', [plotId, projectId]);
  res.json({ success: true, message: 'Plot deleted successfully' });
});

// Clusters
export const createCluster = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { phase_id, name, description, color } = req.body;
  const [cluster] = await query(`INSERT INTO plot_clusters (project_id, phase_id, name, description, color) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [projectId, phase_id ?? null, name, description ?? null, color ?? null]);
  res.status(201).json({ success: true, data: cluster });
});

export const updateCluster = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, clusterId } = req.params;
  const { phase_id, name, description, color } = req.body;
  const [updated] = await query(`UPDATE plot_clusters SET phase_id=COALESCE($1,phase_id), name=COALESCE($2,name), description=COALESCE($3,description), color=COALESCE($4,color), updated_at=NOW() WHERE id=$5 AND project_id=$6 RETURNING *`, [phase_id, name, description, color, clusterId, projectId]);
  if (!updated) throw new NotFoundError('Cluster not found');
  res.json({ success: true, data: updated });
});

export const deleteCluster = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, clusterId } = req.params;
  await query('DELETE FROM plot_clusters WHERE id = $1 AND project_id = $2', [clusterId, projectId]);
  res.json({ success: true, message: 'Cluster deleted' });
});

// Map Versions
export const saveMapVersion = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { snapshot } = req.body;
  const existing = await queryOne<{ version_number: number }>('SELECT MAX(version_number) as version_number FROM project_map_versions WHERE project_id = $1', [projectId]);
  const nextVersion = ((existing as any)?.version_number ?? 0) + 1;
  const [version] = await query(`INSERT INTO project_map_versions (project_id, version_number, status, snapshot, created_by) VALUES ($1,$2,'DRAFT',$3,$4) RETURNING *`, [projectId, nextVersion, JSON.stringify(snapshot ?? {}), req.user?.userId]);
  res.status(201).json({ success: true, data: version });
});

export const publishMapVersion = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, versionId } = req.params;
  const version = await queryOne('SELECT * FROM project_map_versions WHERE id = $1 AND project_id = $2', [versionId, projectId]);
  if (!version) throw new NotFoundError('Map version not found');
  const [published] = await query(`UPDATE project_map_versions SET status='PUBLISHED', published_by=$1, published_at=NOW() WHERE id=$2 RETURNING *`, [req.user?.userId, versionId]);
  res.json({ success: true, data: published });
});

export const listMapVersions = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const versions = await query(`SELECT pmv.*, u.name as published_by_name FROM project_map_versions pmv LEFT JOIN users u ON u.id = pmv.published_by WHERE pmv.project_id = $1 ORDER BY pmv.version_number DESC`, [projectId]);
  res.json({ success: true, data: versions });
});

// Bulk Save
export const bulkSaveMapData = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { plots = [], mapObjects = [], deletedPlotIds = [], deletedObjectIds = [] } = req.body;

  await withTransaction(async (client) => {
    if (deletedObjectIds.length > 0) {
      await client.query('DELETE FROM map_objects WHERE id = ANY($1) AND project_id = $2', [deletedObjectIds, projectId]);
    }
    for (const plotId of deletedPlotIds) {
      const p = await client.query<{ status: string }>('SELECT status FROM project_plots WHERE id = $1 AND project_id = $2', [plotId, projectId]);
      if (p.rows[0]?.status === 'SOLD') continue;
      await client.query('DELETE FROM project_plots WHERE id = $1', [plotId]);
    }
    for (const plot of plots) {
      const { id, plot_number, area, area_unit, width, length, price, price_type, facing, status, display_color, description, geometry, phase_id, cluster_id } = plot;
      if (id) {
        await client.query(
          `UPDATE project_plots SET plot_number=$1,area=$2,area_unit=$3,width=$4,length=$5,price=$6,price_type=$7,facing=$8,status=$9,display_color=$10,description=$11,polygon_geometry=$12,phase_id=$13,cluster_id=$14,updated_at=NOW() WHERE id=$15 AND project_id=$16`,
          [plot_number, area, area_unit ?? 'SQ_FT', width, length, price, price_type ?? 'FIXED', facing, status ?? 'AVAILABLE', display_color, description, geometry ? JSON.stringify(geometry) : null, phase_id ?? null, cluster_id ?? null, id, projectId],
        );
      } else {
        await client.query(
          `INSERT INTO project_plots (project_id,phase_id,cluster_id,plot_number,area,area_unit,width,length,price,price_type,facing,status,display_color,description,polygon_geometry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (project_id, plot_number) DO NOTHING`,
          [projectId, phase_id ?? null, cluster_id ?? null, plot_number, area, area_unit ?? 'SQ_FT', width, length, price, price_type ?? 'FIXED', facing, status ?? 'AVAILABLE', display_color, description, geometry ? JSON.stringify(geometry) : null],
        );
      }
    }
    for (const obj of mapObjects) {
      const { id, phase_id, type, name, geometry, display_style, metadata } = obj;
      if (id) {
        await client.query(
          `UPDATE map_objects SET phase_id=$1,type=$2,name=$3,geometry=$4,display_style=$5,metadata=$6,updated_at=NOW() WHERE id=$7 AND project_id=$8`,
          [phase_id ?? null, type, name ?? null, JSON.stringify(geometry), display_style ? JSON.stringify(display_style) : null, metadata ? JSON.stringify(metadata) : null, id, projectId],
        );
      } else {
        await client.query(
          `INSERT INTO map_objects (project_id,phase_id,type,name,geometry,display_style,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [projectId, phase_id ?? null, type, name ?? null, JSON.stringify(geometry), display_style ? JSON.stringify(display_style) : null, metadata ? JSON.stringify(metadata) : null],
        );
      }
    }
  });

  res.json({ success: true, message: 'Map data saved successfully' });
});
// Admin: Resolve Google Maps Short Link (e.g. maps.app.goo.gl)
export const resolveMapLink = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    throw new BadRequestError('URL query parameter is required');
  }
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    res.json({ success: true, data: { finalUrl: response.url || url } });
  } catch (err) {
    res.json({ success: true, data: { finalUrl: url } });
  }
});
