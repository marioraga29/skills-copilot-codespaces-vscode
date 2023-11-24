// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create express application
const app = express();

// Use body parser to parse json data
app.use(bodyParser.json());
// Use cors to handle cross-origin resource sharing
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create endpoint to get all comments for a post
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create endpoint to create a comment for a post
app.post('/posts/:id/comments', async (req, res) => {
  // Generate id for comment
  const commentId = randomBytes(4).toString('hex');
  // Get the content from the request body
  const { content } = req.body;
  // Get the comments for the post id from the request params
  const comments = commentsByPostId[req.params.id] || [];
  // Push new comment into comments array
  comments.push({ id: commentId, content, status: 'pending' });
  // Set the comments for the post id
  commentsByPostId[req.params.id] = comments;
  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Send response
  res.status(201).send(comments);
});

// Create endpoint to handle events from event bus
app.post('/events', async (req, res) => {
  console.log('Received event', req.body.type);
  const { type, data } = req.body;
  if (type === 'CommentModerated') {
    // Get the comments for the post id
    const comments = commentsByPostId[data.postId];
    // Find the comment with the matching id
    const comment = comments.find((comment) => comment.id === data.id);
    // Update the status of the comment
    comment.status = data.status;
    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events

