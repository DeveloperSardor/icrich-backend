import DepartmentSchema from '../schemas/departments.js';
import LeadershipSchema from '../schemas/leadership.js';

export class DepartmentContr {
  // GET /api/department or /api/department/:id
  static async Get(req, res) {
    try {
      const { id } = req.params;
      const { kind, status, page = 1, limit = 100 } = req.query;

      if (id) {
        const data = await DepartmentSchema
          .findById(id)
          .populate('headId', 'name position img email phone')
          .populate('deputyIds', 'name position img');

        if (!data) {
          return res.status(404).json({
            success: false,
            message: 'Department not found'
          });
        }

        const employees = await LeadershipSchema
          .find({ 
            departmentId: id,
            role: 'employee',
            isActive: true
          })
          .select('name position img email phone bio order')
          .sort({ order: 1, createdAt: -1 });

        const departmentData = data.toObject();
        departmentData.employees = employees;

        return res.json({
          success: true,
          data: departmentData
        });
      }

      const query = {};
      if (kind) query.kind = kind;
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const departments = await DepartmentSchema
        .find(query)
        .populate('headId', 'name position img')
        .sort({ order: 1, createdAt: 1 })
        .limit(parseInt(limit))
        .skip(skip);

      const departmentsWithEmployees = await Promise.all(
        departments.map(async (dept) => {
          const employees = await LeadershipSchema
            .find({ 
              departmentId: dept._id,
              role: 'employee',
              isActive: true
            })
            .select('name position img email phone order')
            .sort({ order: 1 });

          const deptObj = dept.toObject();
          deptObj.employees = employees;
          return deptObj;
        })
      );

      const total = await DepartmentSchema.countDocuments(query);

      res.json({
        success: true,
        data: departmentsWithEmployees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Department GET error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/department/slug/:slug
  static async GetBySlug(req, res) {
    try {
      const { slug } = req.params;

      const data = await DepartmentSchema
        .findOne({ slug })
        .populate('headId', 'name position img email phone')
        .populate('deputyIds', 'name position img');

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      const employees = await LeadershipSchema
        .find({ 
          departmentId: data._id,
          role: 'employee',
          isActive: true
        })
        .select('name position img email phone bio order')
        .sort({ order: 1 });

      const departmentData = data.toObject();
      departmentData.employees = employees;

      res.json({
        success: true,
        data: departmentData
      });
    } catch (error) {
      console.error('Department GetBySlug error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/department
  static async Post(req, res) {
    try {
      const { title, img, order = 0 } = req.body;

      if (!title || !title.uz || !title.ru || !title.en) {
        return res.status(400).json({
          success: false,
          message: 'Title in all languages is required'
        });
      }

      const addedDepartment = await DepartmentSchema.create({
        title,
        img,
        order,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Department successfully added',
        data: addedDepartment
      });
    } catch (error) {
      console.error('Department POST error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/department/:id
  static async Put(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      delete updates.createdBy;
      delete updates.createdAt;

      const updatedDepartment = await DepartmentSchema
        .findByIdAndUpdate(id, updates, { 
          new: true, 
          runValidators: true 
        });

      if (!updatedDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      const employees = await LeadershipSchema
        .find({ 
          departmentId: updatedDepartment._id,
          role: 'employee',
          isActive: true
        })
        .select('name position img order');

      const departmentData = updatedDepartment.toObject();
      departmentData.employees = employees;

      res.json({
        success: true,
        message: 'Department successfully updated',
        data: departmentData
      });
    } catch (error) {
      console.error('Department PUT error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/department/:id/reorder - Tartibni o'zgartirish
  static async Reorder(req, res) {
    try {
      const { id } = req.params;
      const { order } = req.body;

      if (order === undefined || order === null) {
        return res.status(400).json({
          success: false,
          message: 'Order is required'
        });
      }

      const updatedDepartment = await DepartmentSchema.findByIdAndUpdate(
        id,
        { order: parseInt(order) },
        { new: true }
      );

      if (!updatedDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.json({
        success: true,
        message: 'Department order updated successfully',
        data: updatedDepartment
      });
    } catch (error) {
      console.error('Department Reorder error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/department/:id
  static async Delete(req, res) {
    try {
      const { id } = req.params;

      const department = await DepartmentSchema.findById(id);
      
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      const employeeCount = await LeadershipSchema.countDocuments({
        departmentId: id,
        role: 'employee'
      });

      if (employeeCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete department with ${employeeCount} employees. Please reassign them first.`
        });
      }

      const deletedDepartment = await DepartmentSchema.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Department successfully deleted',
        data: deletedDepartment
      });
    } catch (error) {
      console.error('Department DELETE error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}