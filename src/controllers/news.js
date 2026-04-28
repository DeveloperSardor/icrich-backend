import NewsSchema from '../schemas/news.js'

export class NewsContr{
    constructor(){}

    static async Get(req, res){
        try {
            const { id } = req.params;
            const { page = 1, limit = 6, search = '' } = req.query;

            if(id){ 
                const news = await NewsSchema.findById(id);
                res.send({
                    status: 200,
                    message: "News",
                    success: true,
                    data: news
                })
            } else {
                // Search query
                const searchQuery = search ? {
                    $or: [
                        { title_en: { $regex: search, $options: 'i' } },
                        { title_ru: { $regex: search, $options: 'i' } },
                        { title_uz: { $regex: search, $options: 'i' } },
                        { text_en: { $regex: search, $options: 'i' } },
                        { text_ru: { $regex: search, $options: 'i' } },
                        { text_uz: { $regex: search, $options: 'i' } }
                    ]
                } : {};

                const skip = (parseInt(page) - 1) * parseInt(limit);
                const total = await NewsSchema.countDocuments(searchQuery);
                const news = await NewsSchema.find(searchQuery)
                    .sort({ date: -1, createdAt: -1 })
                    .limit(parseInt(limit))
                    .skip(skip);

                res.send({
                    status: 200,
                    message: "News",
                    success: true,
                    data: news,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                })
            }

        } catch (error) {
            console.error('Error in Get News:', error);
            res.send({
                status: 400,
                message: error.message,
                success: false
            })
        }
    }

    static async Post(req, res) {
        try {
            const { title_en, title_ru, title_uz, text_en, text_ru, text_uz, youtube_link, files, date } = req.body;
        
            if (youtube_link && files && files.length > 0) {
                throw new Error('You can only submit either a YouTube link or files, not both.');
            }
        
            if (!youtube_link && (!files || files.length === 0)) {
                throw new Error('Please provide either a YouTube link or files.');
            }
        
            const addedNews = await NewsSchema.create({
                title_en,
                title_ru,
                title_uz,
                text_en,
                text_ru,
                text_uz,
                youtube_link,
                date,
                files: files?.map((image) => ({ type_file: 'image', link: image })),
            });
        
            res.status(201).send({
                status: 201,
                message: 'News successfully created',
                success: true,
                data: addedNews,
            });
        } catch (error) {
            console.error('Error in Post News:', error);
            res.status(400).send({
                status: 400,
                message: error.message,
                success: false,
            });
        }
    }
      
    static async Put(req, res) {
        try {
            const { id } = req.params;
            const findNewsById = await NewsSchema.findById(id);
            if (!findNewsById) {
                throw new Error(`News not found`);
            }
            const { title_en, title_ru, title_uz, text_en, text_ru, text_uz, youtube_link, files, date } = req.body;
        
            if (youtube_link && files && files.length > 0) {
                throw new Error('You can only submit either a YouTube link or files, not both.');
            }
        
            const updateNews = await NewsSchema.findByIdAndUpdate(
                id, 
                { 
                    title_en, 
                    title_ru, 
                    title_uz, 
                    text_en, 
                    text_ru, 
                    text_uz, 
                    youtube_link, 
                    date,
                    files: files?.map((image) => ({ type_file: 'image', link: image })) 
                }, 
                { new: true }
            );
        
            res.send({
                status: 200,
                message: `Successfully updated`,
                success: true,
                data: updateNews
            });
        } catch (error) {
            console.error('Error in Put News:', error);
            res.send({
                status: 400,
                message: error.message,
                success: false,
            });
        }
    }
      
    static async Delete(req, res){
        try {
            const { id } = req.params;
            const findNewsById = await NewsSchema.findById(id);
            if(!findNewsById){
                throw new Error(`News not found`)
            }
            const deleteNews = await NewsSchema.findByIdAndDelete(id)
            res.send({
                status: 200,
                message: `Successfully deleted`,
                success: true,
                data: deleteNews
            })
        } catch (error) {
            console.error('Error in Delete News:', error);
            res.send({
                status: 400,
                message: error.message,
                success: false
            })
        }
    }
}