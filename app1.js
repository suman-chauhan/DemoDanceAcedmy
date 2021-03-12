const express = require("express");
const nodemailer = require("nodemailer");
// const hostname = '127.0.0.1';
const app = express();
const validator = require('validator');
const bodyparser = require('body-parser');
const urlencodedParser = bodyparser.urlencoded({
  extended: false
})
const {
  body,
  validationResult,
  check
} = require('express-validator');
const path = require('path');
app.use(express.urlencoded());


// custom middleware to log data access
const log = function (request, response, next) {
  console.log(`${new Date()}: ${request.protocol}://${request.get('host')}${request.originalUrl}`);
  console.log(request.body); // make sure JSON middleware is loaded first
  next();
}
app.use(log);
// end custom middleware
// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({
  extended: false
}))
app.use(express.json());
// app.use(bodyparser.json());
let urlencoded = bodyparser.urlencoded({
  extended: false
});


// database
const mongoose = require('mongoose');
const {
  response
} = require("express");
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//define port
const port = process.env.PORT || 5000;

//dafine mongoose schema
const FormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isAlpha(value)) {
        throw new Error("should be alphabatic");
      }
    },
    minlength: [3, 'minimum length is 3 char'],
    maxlength: [15, 'max length is 15 char'],
  },
  dob: {

    type: String,
    required: true,
    validate(value) {
      if (!validator.isDate(value)) {
        throw new Error("should be a date");
      }
    }

  },
  email: {

    type: String,
    require: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("invalid email");
      }

    },

  },
  phone: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isNumeric(value)) {
        throw new Error("enter 10 digits indian phone number");
      }

    },
    minlength: [10, 'minimum length is 10 digit'],
    maxlength: [10, 'max length is 10 digit'],
  },

}, {
  timestamps: {
    createdAt: 'created_at'
  }
});

const Form = mongoose.model('form', FormSchema);
//serving static files
app.use(express.static(path.join(__dirname, "static")));



//pug spacefic stuff
app.set('view engine', 'pug'); //set the template engine as pug
app.set('views', path.join(__dirname, 'views')); //set the views directory

app.get("/", (req, res) => {


  res.statusCode = 200;
  res.sendFile(path.join(__dirname, "views", "Form.html"));
});


app.post('/',

  urlencodedParser, [
    check('name', 'This name must me 3+ characters long')
    .exists()
    .isEmpty()
    .isAlpha()
    .isLength({
      min: 3
    })
    .isLength({
      max: 15
    }),

    check('dob', 'enter valid date of birth')
    .isDate()
    .isNumeric()
    .isEmpty(),

    check('email', 'Email is not valid')
    .isEmail()
    .isEmpty()
    .isAlphanumeric(),

    check('phone', 'enter 10 digit indain phone number')
    .isEmpty()
    .isNumeric()
    .isLength({
      min: 10
    })
    .isLength({
      max: 10
    })
  ],

  (req, res) => {


    {

      const myData = new Form(req.body);
      myData.save().then(() => {
        sendEmail(req.body);
        const userData = Form.find({});
        userData.exec().then((data) => {
          console.log(data);
            const param = {
              myTestKey: data
            };
            res.status(200).render('result.pug', param);
          })
          .catch((err) => console.log("GOt Error : " + err));

        // res.statusCode = 200;
        // res.sendFile(path.join(__dirname, "static", "AllData.html"));
      }).catch((error) => {
        res.status(400).send("Form has been not submitted sucessfully.." + error);
      });
    }

  });

function sendEmail(userInfo) {
  const gmailAccount = process.env.SENDER_EMAIL;
  const gmailPass = process.env.SENDER_EMAIL_PASS;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailAccount,
      pass: gmailPass
    }
  });

  const mailOptions = {
    from: gmailAccount,
    to: userInfo.email,
    subject: 'Dance Acdemy',
    text: 'Welcome ' + userInfo.name + ',\nTo our DEMO DANCE ACADEMY\n Regards\nDEMO ACADEMY'
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


app.listen(port, () => {
  console.log(`running on port ${port}`);
});