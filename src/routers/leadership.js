// ==================== routes/leadership.js ====================
import { Router } from 'express';
import { LeadershipContr } from '../controllers/leadership.js';

const LeadershipRouter = Router();

// ===== Public routes =====

// Get all leadership and employees (with optional filters)
// GET /api/leadership - hammasi
// GET /api/leadership?role=leadership - faqat rahbariyat
// GET /api/leadership?role=employee - faqat xodimlar
// GET /api/leadership?departmentId=123 - departmentga oid xodimlar
LeadershipRouter.get('/', LeadershipContr.Get);

// Get employees by department
// GET /api/leadership/department/:departmentId
LeadershipRouter.get('/department/:departmentId', LeadershipContr.GetByDepartment);

// Get only leadership members
// GET /api/leadership/role/leadership
LeadershipRouter.get('/role/leadership', LeadershipContr.GetLeadership);

// Get only employees (with optional department filter)
// GET /api/leadership/role/employees?departmentId=123
LeadershipRouter.get('/role/employees', LeadershipContr.GetEmployees);

// Get single leadership/employee by ID
// GET /api/leadership/:id
LeadershipRouter.get('/:id', LeadershipContr.Get);

// ===== Protected routes (authentication required) =====

// Create new leadership/employee
// POST /api/leadership
LeadershipRouter.post('/', LeadershipContr.Post);

// Update leadership/employee
// PUT /api/leadership/:id
LeadershipRouter.put('/:id', LeadershipContr.Put);

// Delete leadership/employee
// DELETE /api/leadership/:id
LeadershipRouter.delete('/:id', LeadershipContr.Delete);

export default LeadershipRouter;