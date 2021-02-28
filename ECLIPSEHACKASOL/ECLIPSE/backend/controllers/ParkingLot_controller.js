const PLModel = require('../Models/ParkingLot')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")

const generator = require("generate-password")

const RegisterPL = async (req, res) => {
    try {
        if (!req.body.email ||
            !req.body.phone ||
            !req.body.password ||
            !req.body.name ||
            !req.body.address) {

            return res.status(400).json({
                message: "Please send all required fields.",
            });
        }

        const existingAccount = await PLModel.findOne({
            $or: [{ email: req.body.email }, { phone: req.body.phone }],
        });

        if (existingAccount) {
            return res.status(400).json({
                message: "Account with this email or phone number already exists"
            })
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        let newUser = new PLModel({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword,
            address: req.body.address
        });
        await newUser.save();

        return res.status(200).json({ message: "Registration Completed", data: newUser });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const LoginUser = async (req, res) => {
    try {
        if (!req.body.cred || !req.body.password) {
            return res.status(400).json({ message: "Please Provide all the fields" })
        }

        let user;

        if (Number(req.body.cred)) {
            user = await PLModel.findOne({ phone: Number(req.body.cred) })

        } else {
            user = await PLModel.findOne({ email: req.body.cred })
        }
        //console.log(user)
        if (!user) {
            return res.status(201).json({ message: "User Not found!" });
        }
        const verify = bcrypt.compareSync(req.body.password, user.password);
        if (!verify) {
            return res.status(201).json({ message: "Incorrect Password or Email!" });
        }
        const token = jwt.sign({ _id: user._id }, process.env.PL_JWT_SECRET);
        return res
            .status(200)
            .json({ message: "Login Succesfull", data: { user, token } });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Internal server Error" })
    }
}

const completeInfo = async (req, res) => {
    try {
        const updatedUser = await PLModel.findByIdAndUpdate(
            req.userData._id,
            req.body,
            { new: true }
        );
        res.status(200).json({ message: "User Details was updated!", data: updatedUser });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const getAllPL = async (req, res) => {
    try {
        const allPL = await PLModel.find({})
        res.status(200).send(allPL);
    } catch (e) {
        console.log(e);
        res.status(404).json({ message: "Internal server error" });
    }
}

const getPLbyId = async (req, res) => {
    try {
        let PL = await PLModel.findOne({ _id: req.params.id })

        res.status(200).send(PL);
    } catch (e) {
        console.log(e);
        res.status(404).json({ message: "Internal server error" });
    }
};

const rating = async (req, res) => {
    try {
        const user = await PLModel.findOne(
            { _id: req.params.id }
        )
        // console.log(user)
        let p = user.averageRating;
        //console.log(user.averageCount)

        //console.log(req.body)

        p = p * (user.averageCount);
        p += Number(req.body.rating);

        //  console.log((req.body))
        user.averageCount += 1;
        p = p / user.averageCount;
        user.averageRating = p
        // console.log(user)
        //console.log(p)
        const newuser = await PLModel.findByIdAndUpdate(user._id, user, { new: true });
        // console.log(newuser)
        res.status(200).send(newuser)

    }
    catch (e) {
        console.log(e);
        res.status(404).json({ message: "Internal server error" });
    }
}

const searchPL = async(req,res)=>{
    
    try{
     // console.log(req.query.keyword)
      if(req.query.keyword!==''){
       
        PLModel.find({
          $or:[{'name': {
            $regex: req.query.keyword,
            $options: 'i',
          }},
        {
          'address': {
            $regex: req.query.keyword,
            $options: 'i',
          }
          
        },
      ]
          
      },function(err,docs){
      //  console.log(docs.length)
        if(!err){ 
          res.status(200).send(docs);
        return}
        console.log(err)
    })
   
      }        
    }
    catch{
      console.log(e);
      res.status(404).json({ message: "Internal server error." });
    }
}

module.exports = {
    getAllPL,
    getPLbyId,
    RegisterPL,
    LoginUser,
    completeInfo,
    rating,
    searchPL
}