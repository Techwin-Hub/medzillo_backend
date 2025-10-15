const express = require('express');
const router = express.Router();
const {
    getAllTodos, createTodo, updateTodo, deleteTodo,
    getAllChatMessages, sendMessage, markMessagesAsRead,
    createSharedLink,
} = require('../controllers/utilitiesController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes in this file

// To-Do routes
router.route('/todos').get(getAllTodos).post(createTodo);
router.route('/todos/:todoId').put(updateTodo).delete(deleteTodo);

// Chat routes
router.route('/chat/messages').get(getAllChatMessages).post(sendMessage);
router.route('/chat/mark-read').post(markMessagesAsRead);

// Shared Link routes
router.route('/share').post(createSharedLink);

module.exports = router;
