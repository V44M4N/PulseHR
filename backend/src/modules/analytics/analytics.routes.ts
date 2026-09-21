import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { atLeast } from '../../middleware/rbac';
import { analyticsController } from './analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.use(atLeast('HR'));

analyticsRouter.get('/headcount', analyticsController.getHeadcountTrend);
analyticsRouter.get('/attrition', analyticsController.getAttritionByDept);
analyticsRouter.get('/kpis',      analyticsController.getKpis);
