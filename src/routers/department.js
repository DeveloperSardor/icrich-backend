import { Router } from 'express';
import { DepartmentContr } from '../controllers/departments.js';

const DepartmentRouter = Router();

DepartmentRouter.get('/', DepartmentContr.Get);
DepartmentRouter.get('/slug/:slug', DepartmentContr.GetBySlug);
DepartmentRouter.get('/:id', DepartmentContr.Get);
DepartmentRouter.post('/', DepartmentContr.Post);
DepartmentRouter.put('/:id', DepartmentContr.Put);
DepartmentRouter.put('/:id/reorder', DepartmentContr.Reorder); // YANGI
DepartmentRouter.delete('/:id', DepartmentContr.Delete);

export default DepartmentRouter;