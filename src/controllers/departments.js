// ==================== controllers/departments.js ====================
import DepartmentSchema from '../schemas/departments.js';
import LeadershipSchema from '../schemas/leadership.js';

export class DepartmentContr {
  // GET /api/department or /api/department/:id
  static async Get(req, res) {
    try {
      const { id } = req.params;
      const { kind, status, page = 1, limit = 10 } = req.query;

      // Bitta department olish
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

        // Departmentga tegishli xodimlarni alohida olish
        const employees = await LeadershipSchema
          .find({ 
            departmentId: id,
            role: 'employee',
            isActive: true
          })
          .select('name position img email phone bio order')
          .sort({ order: 1, createdAt: -1 });

        // Department obyektiga xodimlarni qo'shish
        const departmentData = data.toObject();
        departmentData.employees = employees;

        return res.json({
          success: true,
          data: departmentData
        });
      }

      // Barcha departmentlarni olish
      const query = {};
      if (kind) query.kind = kind;
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Departmentlarni olish
      const departments = await DepartmentSchema
        .find(query)
        .populate('headId', 'name position img')
        .sort({ order: 1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      // Har bir department uchun xodimlarni alohida olish
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

      // Departmentga tegishli xodimlarni olish
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
      const {
        slug,
        title,
        description,
        img,
        kind,
        headId,
        deputyIds,
        contacts,
        order,
        status
      } = req.body;

      // Validation
      if (!title?.uz || !title?.ru || !title?.en) {
        return res.status(400).json({
          success: false,
          message: 'Title in all languages is required'
        });
      }

      // Check slug uniqueness
      if (slug) {
        const existing = await DepartmentSchema.findOne({ slug });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Slug already exists'
          });
        }
      }

      const addedDepartment = await DepartmentSchema.create({
        slug,
        title,
        description,
        img,
        kind,
        headId,
        deputyIds,
        contacts,
        order,
        status,
        createdBy: req.user?._id
      });

      await addedDepartment.populate([
        { path: 'headId', select: 'name position' },
        { path: 'deputyIds', select: 'name position' }
      ]);

      // Xodimlarni olish
      const employees = await LeadershipSchema
        .find({ 
          departmentId: addedDepartment._id,
          role: 'employee',
          isActive: true
        })
        .select('name position img');

      const departmentData = addedDepartment.toObject();
      departmentData.employees = employees;

      res.status(201).json({
        success: true,
        message: 'Department successfully added',
        data: departmentData
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

      if (req.user?._id) {
        updates.updatedBy = req.user._id;
      }

      if (updates.slug) {
        const existing = await DepartmentSchema.findOne({ 
          slug: updates.slug,
          _id: { $ne: id }
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Slug already exists'
          });
        }
      }

      const updatedDepartment = await DepartmentSchema
        .findByIdAndUpdate(id, updates, { 
          new: true, 
          runValidators: true 
        })
        .populate('headId', 'name position')
        .populate('deputyIds', 'name position');

      if (!updatedDepartment) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Xodimlarni olish
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

      // Departmentda xodimlar borligini tekshirish
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

  // POST /api/department/:id/employees - Xodim qo'shish (bu metod kerak emas, lekin API uchun qoldiramiz)
  static async AddEmployee(req, res) {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }

      // Xodimni tekshirish
      const employee = await LeadershipSchema.findOne({
        _id: employeeId,
        role: 'employee'
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Department tekshirish
      const department = await DepartmentSchema.findById(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Xodimning departmentId ni yangilash
      employee.departmentId = id;
      await employee.save();

      // Yangilangan departmentni qaytarish
      const employees = await LeadershipSchema
        .find({ 
          departmentId: id,
          role: 'employee',
          isActive: true
        })
        .select('name position img order');

      const departmentData = department.toObject();
      departmentData.employees = employees;

      res.json({
        success: true,
        message: 'Employee added to department successfully',
        data: departmentData
      });
    } catch (error) {
      console.error('AddEmployee error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/department/:id/employees/:employeeId - Xodimni o'chirish
  static async RemoveEmployee(req, res) {
    try {
      const { id, employeeId } = req.params;

      // Xodimni tekshirish
      const employee = await LeadershipSchema.findOne({
        _id: employeeId,
        departmentId: id,
        role: 'employee'
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found in this department'
        });
      }

      // Xodimdan departmentni olib tashlash
      employee.departmentId = null;
      await employee.save();

      // Yangilangan departmentni qaytarish
      const department = await DepartmentSchema.findById(id);
      if (!department) {
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
        .select('name position img order');

      const departmentData = department.toObject();
      departmentData.employees = employees;

      res.json({
        success: true,
        message: 'Employee removed from department successfully',
        data: departmentData
      });
    } catch (error) {
      console.error('RemoveEmployee error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}