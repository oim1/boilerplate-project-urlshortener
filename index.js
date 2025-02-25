require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const dns = require('dns'); // for validating links

// db connection - using mongoose

mongoose.connect(process.env.URI).catch((err) => {console.log(err)});

// create model for links

const Schema = mongoose.Schema;
const linkSchema = new Schema({
  origLink: String,
  shortLinkNum: Number,
});

let Link = mongoose.model('Link', linkSchema);

// enter a link into the database
let createSaveLink = (input) => {

  // @TODO - check for duplicate rand num and regenerate if found duplicate.
  let shortLinkRandNum = Math.floor(Math.random() * 1000)
  let inputLink = new Link({origLink: input, shortLinkNum: shortLinkRandNum});

  inputLink.save().then(() => {
    console.log("Link uploaded successfully.");
  }).catch(err => {
    console.log(err);
  });

  return inputLink;
};

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


app.post('/api/shorturl', (req, res) => {
  let data = req.body;

  try {
    const url = new URL(data.url); // convert input to URL
    dns.lookup(url.hostname, async (err) => {
      if (err) {
        res.json({error: "invalid url"});
      } else {
        let resJSON = createSaveLink(data.url);
        res.json({ "original_url": resJSON.origLink, "short_url": resJSON.shortLinkNum });
      }
    })
  } catch (err) {
    res.json({error: "invalid url"});
  }
})

app.get('/api/shorturl/:url', async (req, res) => {
  let urlNum = Number(req.params.url);
  const link = await Link.findOne({shortLinkNum: urlNum});

  if (link) {
    res.redirect(link.origLink);
  } else {
    res.status(404).send('Not Found');
  }
});
