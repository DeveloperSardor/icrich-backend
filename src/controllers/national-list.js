// controllers/national-list.js
import NationalListSchema from "../schemas/national-list.js";

export class NationalListContr {
  constructor() {}

  // GET method with pagination and search
  static async Get(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 9, search = "", filter = "all" } = req.query;

      if (id) {
        const national = await NationalListSchema.findById(id);
        if (!national) {
          return res.send({
            status: 404,
            message: "National list item not found",
            success: false,
          });
        }
        return res.send({
          status: 200,
          message: "National list data",
          success: true,
          data: national,
        });
      }

      // Build query
      let query = {};
      
      // Search functionality
      if (search) {
        query.$or = [
          { title_en: { $regex: search, $options: "i" } },
          { title_ru: { $regex: search, $options: "i" } },
          { title_uz: { $regex: search, $options: "i" } },
          { text_en: { $regex: search, $options: "i" } },
          { text_ru: { $regex: search, $options: "i" } },
          { text_uz: { $regex: search, $options: "i" } },
        ];
      }

      // Filter functionality
      if (filter === "video") {
        query.youtube_link = { $exists: true, $ne: "" };
      } else if (filter === "images") {
        query.images = { $exists: true, $not: { $size: 0 } };
      }

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Get total count
      const total = await NationalListSchema.countDocuments(query);

      // Get paginated data
      const data = await NationalListSchema.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.send({
        status: 200,
        message: "National list data",
        success: true,
        data: data,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error) {
      res.send({
        status: 400,
        message: error.message,
        success: false,
      });
    }
  }

  // POST method - Create new national list item
  static async Post(req, res) {
    try {
      const {
        youtube_link,
        images,
        title_en,
        title_ru,
        title_uz,
        text_en,
        text_ru,
        text_uz,
      } = req.body;

      // Validation
      if (!title_en || !title_ru || !title_uz) {
        return res.send({
          status: 400,
          message: "All titles are required",
          success: false,
        });
      }

      if (!text_en || !text_ru || !text_uz) {
        return res.send({
          status: 400,
          message: "All texts are required",
          success: false,
        });
      }

      if (!youtube_link && (!images || images.length === 0)) {
        return res.send({
          status: 400,
          message: "Either YouTube link or images are required",
          success: false,
        });
      }

      const newNational = new NationalListSchema({
        youtube_link,
        images,
        title_en,
        title_ru,
        title_uz,
        text_en,
        text_ru,
        text_uz,
      });

      await newNational.save();

      res.send({
        status: 201,
        message: "Successfully added",
        success: true,
        data: newNational,
      });
    } catch (error) {
      res.send({
        status: 400,
        message: error.message,
        success: false,
      });
    }
  }

  // PUT method - Update existing national list item
  static async Put(req, res) {
    try {
      const { id } = req.params;
      const {
        youtube_link,
        images,
        title_en,
        title_ru,
        title_uz,
        text_en,
        text_ru,
        text_uz,
      } = req.body;

      // Validation
      if (!title_en || !title_ru || !title_uz) {
        return res.send({
          status: 400,
          message: "All titles are required",
          success: false,
        });
      }

      if (!text_en || !text_ru || !text_uz) {
        return res.send({
          status: 400,
          message: "All texts are required",
          success: false,
        });
      }

      const updatedNational = await NationalListSchema.findByIdAndUpdate(
        id,
        {
          youtube_link,
          images,
          title_en,
          title_ru,
          title_uz,
          text_en,
          text_ru,
          text_uz,
        },
        { new: true, runValidators: true }
      );

      if (!updatedNational) {
        return res.send({
          status: 404,
          message: "National list item not found",
          success: false,
        });
      }

      res.send({
        status: 200,
        message: "Successfully updated",
        success: true,
        data: updatedNational,
      });
    } catch (error) {
      res.send({
        status: 400,
        message: error.message,
        success: false,
      });
    }
  }

  // DELETE method - Delete national list item
  static async Delete(req, res) {
    try {
      const { id } = req.params;

      const deletedNational = await NationalListSchema.findByIdAndDelete(id);

      if (!deletedNational) {
        return res.send({
          status: 404,
          message: "National list item not found",
          success: false,
        });
      }

      res.send({
        status: 200,
        message: "Successfully deleted",
        success: true,
        data: deletedNational,
      });
    } catch (error) {
      res.send({
        status: 400,
        message: error.message,
        success: false,
      });
    }
  }
}