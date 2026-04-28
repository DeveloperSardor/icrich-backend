import JWT from '../utils/jwt.js'
import AdminSchema from '../schemas/admin.js'
import bcrypt from 'bcryptjs'

function isDatabaseUnavailableError(err) {
  const msg = err?.message || String(err);
  return /buffering timed out|ECONNREFUSED|ENOTFOUND|Server selection timed out|MongoNetworkError|topology was destroyed|connection.*timed out/i.test(
    msg
  );
}

export class AdminContr {
    constructor() {}
  

  static async AddAdmin(req, res){
    try {
        const { fullname, login, password } = req.body;
        const newAdmin = await AdminSchema.create({ fullname, login, password })
        const token = JWT.SIGN(newAdmin?._id)
        res.send({
            status : 201,
            message : "Successfuly added",
            success : true,
            data : newAdmin,
            token
        })
    } catch (error) {
        res.status(400).send({
            status: 400,
            message: error.message,
            success: false,
          });
    }
  }


    static async Login(req, res) {
      try {
        const { login, password } = req.body;
  
        if (!login || !password) {
          return res.status(400).send({
            status: 400,
            message: "Login and password are required",
            success: false,
          });
        }

        // Find admin by login
        const admin = await AdminSchema.findOne({ login });
        if (!admin) {
          throw new Error(`Invalid login credentials`);
        }
  
        // Compare entered password with the hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          throw new Error(`Invalid login credentials`);
        }
  
        // Generate JWT token
        const token = JWT.SIGN(admin._id);
  
        // Send response without the password
        const { _id, fullname } = admin.toObject();
        res.status(200).send({
          status: 200,
          message: "Login successful",
          token,
          success : true,
          data: { _id, fullname, login },
        });
      } catch (error) {
        const dbDown = isDatabaseUnavailableError(error);
        console.error("Error during login:", error.message);
        const status = dbDown ? 503 : 400;
        res.status(status).send({
          status,
          success: false,
          message: dbDown
            ? "Database is unreachable. Check DB_URL, MongoDB Atlas network access (server IP), and cluster status."
            : error.message,
        });
      }
    }
  }
  