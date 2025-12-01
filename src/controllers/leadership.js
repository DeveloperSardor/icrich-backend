// ==================== controllers/leadership.js ====================
import LeadershipSchema from '../schemas/leadership.js';

export class LeadershipContr {
  // GET /api/leadership or /api/leadership/:id
  static async Get(req, res) {
    try {
      const { id } = req.params;
      const { departmentId, isActive, role, page = 1, limit = 50 } = req.query;

      if (id) {
        const data = await LeadershipSchema
          .findById(id)
          .populate('departmentId', 'title slug kind');

        if (!data) {
          return res.status(404).json({
            success: false,
            message: 'Leadership not found'
          });
        }

        return res.json({
          success: true,
          data
        });
      }

      // Build query - role parametri bo'lmasa HAMMASI keladi
      const query = {};
      if (departmentId) query.departmentId = departmentId;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (role && ['leadership', 'employee'].includes(role)) {
        query.role = role; // role berilsa va valid bo'lsa filtr
      }

      const data = await LeadershipSchema
        .find(query)
        .populate('departmentId', 'title slug kind')
        .sort({ order: 1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await LeadershipSchema.countDocuments(query);

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

 
// POST /api/leadership
static async Post(req, res) {
  try {
    const {
      name,
      position,
      role,
      departmentId,
      img,
      bio,
      email,
      phone,
      workPhone,
      academicDegree,
      scientificInterests,
      schedule,
      order,
      isActive
    } = req.body;

    console.log('Kelgan ma\'lumot:', { 
      role, 
      departmentId,
      academicDegree,
      scientificInterests,
      schedule 
    }); // Debug uchun

    // Validation
    if (!name?.uz || !name?.ru || !name?.en) {
      return res.status(400).json({
        success: false,
        message: 'Name in all languages is required'
      });
    }

    if (!position?.uz || !position?.ru || !position?.en) {
      return res.status(400).json({
        success: false,
        message: 'Position in all languages is required'
      });
    }

    // Role validation
    if (!role || !['leadership', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role (leadership or employee) is required'
      });
    }

    // Department validation role ga qarab
    if (role === 'employee' && !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department is required for employees'
      });
    }

    // Leadership data obyekti
    const leadershipData = {
      name,
      position,
      role,
      img,
      bio: bio || { uz: '', ru: '', en: '' },
      email: email || '',
      phone: phone || '',
      workPhone: workPhone || '',
      academicDegree: academicDegree || '',
      scientificInterests: scientificInterests || [],
      schedule: schedule || { days: [], start: '', end: '' },
      order: order || 0,
      isActive: isActive !== false,
      createdBy: req.user?._id
    };

    // Faqat xodim uchun departmentId qo'shamiz
    if (role === 'employee' && departmentId) {
      leadershipData.departmentId = departmentId;
    }

    console.log('Saqlanadigan ma\'lumot:', leadershipData); // Debug uchun

    const newLeadership = await LeadershipSchema.create(leadershipData);

    if (role === 'employee') {
      await newLeadership.populate('departmentId', 'title slug');
    }

    res.status(201).json({
      success: true,
      message: 'Leadership successfully added',
      data: newLeadership
    });
  } catch (error) {
    console.error('POST error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

  // PUT /api/leadership/:id
  static async Put(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      // Remove fields that shouldn't be updated directly
      delete updates.createdBy;
      delete updates.createdAt;

      // ===== YANGI: Role o'zgartirilayotgan bo'lsa validation =====
      if (updates.role) {
        const existingLeadership = await LeadershipSchema.findById(id);
        
        if (!existingLeadership) {
          return res.status(404).json({
            success: false,
            message: 'Leadership not found'
          });
        }

        // Agar role o'zgarayotgan bo'lsa
        if (existingLeadership.role !== updates.role) {
          if (updates.role === 'leadership' && updates.departmentId) {
            return res.status(400).json({
              success: false,
              message: 'Cannot set department for leadership role'
            });
          }
          
          if (updates.role === 'employee' && !updates.departmentId && !existingLeadership.departmentId) {
            return res.status(400).json({
              success: false,
              message: 'Department is required when changing to employee role'
            });
          }

          // Leadership ga o'zgartirish - departmentId ni olib tashlash
          if (updates.role === 'leadership') {
            updates.departmentId = null;
          }
        }
      }

      // Add updatedBy
      if (req.user?._id) {
        updates.updatedBy = req.user._id;
      }

      const updatedLeadership = await LeadershipSchema
        .findByIdAndUpdate(id, updates, { 
          new: true, 
          runValidators: true 
        })
        .populate('departmentId', 'title slug');

      if (!updatedLeadership) {
        return res.status(404).json({
          success: false,
          message: 'Leadership not found'
        });
      }

      res.json({
        success: true,
        message: 'Leadership successfully updated',
        data: updatedLeadership
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/leadership/:id
  static async Delete(req, res) {
    try {
      const { id } = req.params;

      const deletedLeadership = await LeadershipSchema.findByIdAndDelete(id);

      if (!deletedLeadership) {
        return res.status(404).json({
          success: false,
          message: 'Leadership not found'
        });
      }

      res.json({
        success: true,
        message: 'Leadership successfully deleted',
        data: deletedLeadership
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/leadership/department/:departmentId
  static async GetByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      // ===== YANGI: Faqat xodimlarni ko'rsatish =====
      const leaders = await LeadershipSchema
        .find({ 
          departmentId,
          role: 'employee',  // Faqat xodimlar
          isActive: true 
        })
        .sort({ order: 1 });

      res.json({
        success: true,
        data: leaders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== YANGI: Faqat rahbariyatni olish =====
  // GET /api/leadership/role/leadership
  static async GetLeadership(req, res) {
    try {
      const { isActive, page = 1, limit = 50 } = req.query;

      const query = { role: 'leadership' };
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const data = await LeadershipSchema
        .find(query)
        .sort({ order: 1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await LeadershipSchema.countDocuments(query);

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ===== YANGI: Faqat xodimlarni olish =====
  // GET /api/leadership/role/employees
  static async GetEmployees(req, res) {
    try {
      const { departmentId, isActive, page = 1, limit = 50 } = req.query;

      const query = { role: 'employee' };
      if (departmentId) query.departmentId = departmentId;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const data = await LeadershipSchema
        .find(query)
        .populate('departmentId', 'title slug kind')
        .sort({ order: 1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await LeadershipSchema.countDocuments(query);

      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}