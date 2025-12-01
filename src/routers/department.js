// ==================== routes/departments.js ====================
import { Router } from 'express';
import { DepartmentContr } from '../controllers/departments.js';

const DepartmentRouter = Router();

// GET - Barcha departmentlar yoki bitta department
DepartmentRouter.get('/', DepartmentContr.Get);
DepartmentRouter.get('/slug/:slug', DepartmentContr.GetBySlug);
DepartmentRouter.get('/:id', DepartmentContr.Get);

// POST - Yangi department yaratish
DepartmentRouter.post('/', DepartmentContr.Post);

// PUT - Department yangilash
DepartmentRouter.put('/:id', DepartmentContr.Put);

// DELETE - Department o'chirish
DepartmentRouter.delete('/:id', DepartmentContr.Delete);

// POST - Department'ga xodim qo'shish
DepartmentRouter.post('/:id/employees', DepartmentContr.AddEmployee);

// DELETE - Department'dan xodimni o'chirish
DepartmentRouter.delete('/:id/employees/:employeeId', DepartmentContr.RemoveEmployee);

export default DepartmentRouter;