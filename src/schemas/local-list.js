import { model, Schema } from "mongoose";


const LocalListSchema = new Schema({
    title_en : {
        type : String
    },
    title_ru : {
        type : String
    },
    title_uz : {
        type : String
    },
    link : {
        type : String
    },
    date : {
        type : Date
    }
}, {
    timestamps : true
})


export default model('LocalList', LocalListSchema)