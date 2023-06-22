//importing
import { Message } from '@mui/icons-material'
import express from 'express'
import mongoose from 'mongoose'
import Messages from "./dbMessages.js"
import Pusher from "pusher"
//import cors from 'cors'

//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1573764",
    key: "f2d9dad2320b42664a8b",
    secret: "a3e1747b415f8f9408d1",
    cluster: "ap2",
    useTLS: true
  });
//middleware

app.use(express.json());
//app.use(cors);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});


//DB config
const connection_url = "mongodb+srv://admin:clQ3DmACJBr4tJvn@cluster0.crncnld.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(connection_url);

const db = mongoose.connection;

db.once('open',() => {
    console.log("Db connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
            {
                name:messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
            );
        }
        else{
            console.log("error triggering pusher")
        }
    });
});
// ?????

//api routes
app.get("/", (req, res) =>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    // Messages.find((err, data) => {
    //     if(err) {
    //         res.status(500).send(err)
    //     }
    //     else{
    //         res.status(200).send(data)
    //     }
    // })
    Messages.find()
    .then((data) => {
        res.status(201).send(data);
    })
    .catch((err) => {
        res.status(500).send(err);
    });
})

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    // Messages.create(dbMessage, (err, data) => {
    //     if(err){
    //         res.status(500).send(err);
    //     }
    //     else{
    //         res.status(201).send(data);
    //     }
    // });
    Messages.create(dbMessage)
    .then((data) => {
        res.status(201).send(data);
    })
    .catch((err) => {
        res.status(500).send(err);
    });
});


//listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`));