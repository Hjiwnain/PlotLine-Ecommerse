const  express = require('express');
// const bodyParse = require('body-parse');
const bcrypt = require('bcrypt');
const db = require("./database");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const port = 3001;


const app = express();

app.use(express.json())

//The Base API To Query The DataBase
app.get('/fetch_data', async (req,res) => {
    try{
        const [rows,fields] = await db.query("SELECT * FROM userData");
        res.json(rows);
    }catch(err){
        res.status(500).json({message: 'DataBase Error',error: err});
    }
});

//API To Create New UserAccount
//Remember To Change content-type to application/json
app.post('/create_account', async (req, res) => {
    const { username, email, password } = req.body;  // Fetch data from the request body

    if(!username){
        return res.status(400).json({ message : 'Please Enter The Required Username'});
    }
    if(!email){
        return res.status(400).json({ message : 'Please Enter The Required Field. Email'});
    }
    if(!password){
        return res.status(400).json({ message : 'Please Enter The Required Feild. Password'});
    }

    try {
        // Check if username or email already exists
        const [users] = await db.query('SELECT * FROM userData WHERE username = ? OR email = ?', [username, email]);

        if (users.some(user => user.username === username || user.email === email)) {
            let message = '';

            if (users.some(user => user.username === username)) {
                message += 'The Username is taken by some other user please use other username ';
            }

            if (users.some(user => user.email === email)) {
                message += 'Email already exists.';
            }

            return res.status(400).json({ message });
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        if(hashedPassword.length < 2){
            return res.status(528).json({message : "The Servers are Temporiraly Unavialable Please login in latter"});
        }
        console.log("I am here")
        console.log("me");
        console.log("Me" + hashedPassword);
        // If everything is okay, insert the user into the database
        await db.query('INSERT INTO userData (username, email, hashed_password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        console.log("Added into DB");
        //Generating  JWT Auth token
        const playload = {
            userId: 12345,
            role: 'admin'
        }
        console.log("Done this");
        const secret = crypto.randomBytes(256).toString('hex');
        const token = jwt.sign(playload,secret,{expiresIn: '1h'});

        // Return only the username for security reasons, avoid sending back the password (even if it's hashed)
        return res.json({ username,email,token });
    } catch (error) {
        return res.status(500).json({ message: 'Database error', error });
    }
});


//Login Account API
app.post('/Login', async (req,res) => {
    const { username, password } = req.body;
    if(!username){
        return res.status(400).json({ message : 'Please Enter The Required Username'});
    }
    if(!password){
        return res.status(400).json({ message : 'Please Enter The Required Feild. Password'});
    }

    try{
        const [users] = await db.query('SELECT * FROM userData WHERE username = ?', [username]);

        if(!users.length){
            return res.status(401).json({message : "The Username does not exist or is incorrect please check username again. Or Please Singup using /create_account route."});
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password,user.password);

        

        if(!isMatch){
            return res.status(401).json({message : "The Password you have entered is not attached with this account. Please check the password and retry"});
        }

    }
    catch(err){
        return res.status(402).json({message : "The Error in Loging In " + err});
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });