import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import {
  listProjects, getProjectDetails, getProjectMap,
  createProject, updateProject, getProjectByIdAdmin,
  createPhase, updatePhase, deletePhase,
  createMapObject, updateMapObject, deleteMapObject,
  createPlot, updatePlot, deletePlot,
  createCluster, updateCluster, deleteCluster,
  saveMapVersion, publishMapVersion, listMapVersions,
  bulkSaveMapData, resolveMapLink,
} from './project.controller';

const router = Router();

// --- Public Routes ------------------------------------------------------------
router.get('/', listProjects);
router.get('/:slug/map', getProjectMap);
router.get('/:slug', getProjectDetails);

// --- Admin Routes (require authentication + admin role) -----------------------
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.post('/', createProject);
router.get('/resolve-map-link', resolveMapLink);
router.patch('/:id', updateProject);
router.get('/:id/admin', getProjectByIdAdmin);

// Phases
router.post('/:id/phases', createPhase);
router.patch('/:id/phases/:phaseId', updatePhase);
router.delete('/:id/phases/:phaseId', deletePhase);

// Map Objects
router.post('/:id/map-objects', createMapObject);
router.patch('/:id/map-objects/:objectId', updateMapObject);
router.delete('/:id/map-objects/:objectId', deleteMapObject);

// Plots
router.post('/:id/plots', createPlot);
router.patch('/:id/plots/:plotId', updatePlot);
router.delete('/:id/plots/:plotId', deletePlot);

// Clusters
router.post('/:id/clusters', createCluster);
router.patch('/:id/clusters/:clusterId', updateCluster);
router.delete('/:id/clusters/:clusterId', deleteCluster);

// Map Versions
router.post('/:id/map-versions', saveMapVersion);
router.patch('/:id/map-versions/:versionId/publish', publishMapVersion);
router.get('/:id/map-versions', listMapVersions);

// Bulk Save (editor saves all at once)
router.post('/:id/map-data/bulk-save', bulkSaveMapData);

export default router;
