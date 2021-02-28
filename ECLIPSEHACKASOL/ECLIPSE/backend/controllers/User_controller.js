const UserModel = require('../Models/User');
const VehicleModel = require('../Models/Vehicle')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generator = require("generate-password")


const RegisterUser = async (req, res) => {
    try {
        if (!req.body.email ||
            !req.body.phone ||
            !req.body.password ||
            !req.body.name) {

            return res.status(400).json({
                message: "Please send all required fields.",
            });

        }

        const existingAccount = await UserModel.findOne({
            $or: [{ email: req.body.email }, { phone: req.body.phone }],
        });

        if (existingAccount) {
            return res.status(400).json({
                message: "Account with this email or phone number already exists"
            })
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        let newUser = new UserModel({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword,
        });
        await newUser.save();

        return res.status(200).json({ message: "Registration Completed" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const UpdateUser = async (req, res) => {
    try {
        console.log(req);
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.userData._id,
            req.body,
            { new: true }
        );
        res.status(200).json({ message: "User Details was updated!", data: updatedUser });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }

};

const LoginUser = async (req, res) => {
    try {
        if (!req.body.cred || !req.body.password) {
            return res.status(400).json({ message: "Please Provide all the fields" })
        }

        let user;

        if (Number(req.body.cred)) {
            user = await UserModel.findOne({ phone: Number(req.body.cred) })

        } else {
            user = await UserModel.findOne({ email: req.body.cred })
        }

        if (!user) return res.status(400).json({ message: "incorrect credentials" })

        const verify = bcrypt.compareSync(req.body.password, user.password);
        if (!verify) {
            return res.status(201).json({ message: "Incorrect Password or Email!" });
        }
        const token = jwt.sign({ _id: user._id }, process.env.USER_JWT_SECRET);
        return res
            .status(200)
            .json({ message: "Login Succesfull", data: { user, token } });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server Error" })
    }
}

const GoogleAuth = async (req, res) => {

    try {
        let oldUser = true;

        const user = UserModel.findOne({ googleId: req.body.googleId, email: req.body.email });
        if (!user) {
            oldUser = true
            user = new UserModel({
                name: req.body.name,
                email: req.body.email,
                googleId: req.body.googleId
            })

            await user.save();

            const token = jwt.sign({ _id: user._id }, process.env.USER_JWT_SECRET);
            res.status(200).json({
                message: "Google Authentication Successfull",
                data: { user, token, oldUser },
            });

        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Google Authentication unsuccesful" });
    }


}

const RecoverUser = async (req, res) => {
    try {

        let user = UserModel.findOne({ email: req.body.email }, { name: 1, email: 1, phone: 1 })
        if (!user) return res.status(400).json({ message: 'The email address ' + req.body.email + ' is not associated with any account. Double-check your email address and try again.' })

        const new_password = generator.generate({
            length: 10,
            numbers: true
        })

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(new_password, salt);

        const updatedUser = UserModel.updateOne({ email: req.body.email }, { password: hashedPassword }, (err, result) => {
            if (err) {
                res.send(err);
            } else {
                //forgotPassword(req.body.email, newpassword)
                res.status(200).json({ message: "updated" })
            }

        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Password Reset Unsuccesful" });
    }
}

const addVehicleToProfile = async (req, res) => {

    try {

        const user = await UserModel.findById(req.userData._id)


        let vehicles = user.vehicles;

        if (!vehicles) vehicles = [];
        console.log(vehicles);


        const vehicleTest = new VehicleModel({
            seater: req.body.vehicle.seater,
            model: req.body.vehicle.model,
            company: req.body.vehicle.company
        })

        await vehicleTest.save();

        vehicles.push({ vehicle: vehicleTest._id });
        console.log(vehicles);

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.userData._id,
            { vehicles: vehicles },
            { new: true }
        )
        populate('vehicles.vehicle');

        res.status(200).json({ message: "User Details was updated!", data: updatedUser });


    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }



}

module.exports = {
    RecoverUser,
    GoogleAuth,
    LoginUser,
    UpdateUser,
    RegisterUser,
    addVehicleToProfile
}
