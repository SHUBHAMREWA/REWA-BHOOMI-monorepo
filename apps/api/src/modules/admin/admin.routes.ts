import { Router } from 'express';
import { getDashboardStats, listUsers, updateUserStatus, moderateProperty, getAuditLogs, listPropertiesAdmin, listProjectsAdmin, togglePropertyPopular, deletePropertyAdmin, bulkDeletePropertiesAdmin } from './admin.controller';
import { createProject, updateProject, deleteProject, createPlot, deletePlot, getProjectByIdAdmin, updatePlot, createPhase, updatePhase, deletePhase, createMapObject, updateMapObject, deleteMapObject, createCluster, updateCluster, deleteCluster, saveMapVersion, publishMapVersion, listMapVersions, bulkSaveMapData } from '../projects/project.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/stats', asyncHandler(getDashboardStats));
router.get('/users', asyncHandler(listUsers));
router.patch('/users/:id/status', asyncHandler(updateUserStatus));
router.get('/properties', asyncHandler(listPropertiesAdmin));
router.patch('/properties/:id/moderate', asyncHandler(moderateProperty));
router.patch('/properties/:id/popular', asyncHandler(togglePropertyPopular));
router.delete('/properties/:id', asyncHandler(deletePropertyAdmin));
router.post('/properties/bulk-delete', asyncHandler(bulkDeletePropertiesAdmin));
router.get('/projects', asyncHandler(listProjectsAdmin));
router.get('/audit-logs', asyncHandler(getAuditLogs));

// Admin Projects Management
router.get('/projects/:id', getProjectByIdAdmin);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Phases
router.post('/projects/:id/phases', createPhase);
router.patch('/projects/:id/phases/:phaseId', updatePhase);
router.delete('/projects/:id/phases/:phaseId', deletePhase);

// Plots
router.post('/projects/:id/plots', createPlot);
router.patch('/projects/:id/plots/:plotId', updatePlot);
router.delete('/projects/:id/plots/:plotId', deletePlot);

// Map Objects
router.post('/projects/:id/map-objects', createMapObject);
router.patch('/projects/:id/map-objects/:objectId', updateMapObject);
router.delete('/projects/:id/map-objects/:objectId', deleteMapObject);

// Clusters
router.post('/projects/:id/clusters', createCluster);
router.patch('/projects/:id/clusters/:clusterId', updateCluster);
router.delete('/projects/:id/clusters/:clusterId', deleteCluster);

// Map Versions
router.post('/projects/:id/map-versions', saveMapVersion);
router.patch('/projects/:id/map-versions/:versionId/publish', publishMapVersion);
router.get('/projects/:id/map-versions', listMapVersions);

// Bulk Save
router.post('/projects/:id/map-data/bulk-save', bulkSaveMapData);

export default router;

