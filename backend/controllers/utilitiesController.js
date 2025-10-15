const prisma = require('../lib/prisma');

// --- To-Do Management ---
const getAllTodos = async (req, res) => {
    try {
        const todos = await prisma.todoItem.findMany({
            where: { doctorId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching to-do items.' });
    }
};

const createTodo = async (req, res) => {
    const { task, dueDate } = req.body;
    if (!task) return res.status(400).json({ message: 'Task is required.' });
    try {
        const newTodo = await prisma.todoItem.create({
            data: { task, dueDate, doctorId: req.user.id },
        });
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating to-do item.' });
    }
};

const updateTodo = async (req, res) => {
    const { isCompleted } = req.body;
    try {
        const updatedTodo = await prisma.todoItem.update({
            where: { id: req.params.todoId, doctorId: req.user.id },
            data: { isCompleted },
        });
        res.status(200).json(updatedTodo);
    } catch (error) {
        res.status(404).json({ message: 'To-do item not found.' });
    }
};

const deleteTodo = async (req, res) => {
    try {
        await prisma.todoItem.delete({
            where: { id: req.params.todoId, doctorId: req.user.id },
        });
        res.status(200).json({ message: 'To-do item deleted.' });
    } catch (error) {
        res.status(404).json({ message: 'To-do item not found.' });
    }
};

// --- Chat Management ---
const getAllChatMessages = async (req, res) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            where: { clinicId: req.user.clinicId },
            orderBy: { timestamp: 'asc' },
        });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages.' });
    }
};

const sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'Receiver and content are required.' });
    try {
        const newMessage = await prisma.chatMessage.create({
            data: {
                content,
                senderId: req.user.id,
                receiverId,
                clinicId: req.user.clinicId,
            },
        });
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error sending message.' });
    }
};

const markMessagesAsRead = async (req, res) => {
    const { senderId } = req.body;
    try {
        await prisma.chatMessage.updateMany({
            where: { senderId, receiverId: req.user.id, read: false },
            data: { read: true },
        });
        res.status(200).json({ message: 'Messages marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating messages.' });
    }
};

// --- Shared Link Management ---
const createSharedLink = async (req, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'Appointment ID is required.' });
    try {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry
        const newLink = await prisma.sharedLink.upsert({
            where: { appointmentId },
            update: { expiresAt },
            create: { appointmentId, expiresAt },
        });
        res.status(201).json(newLink);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating shared link.' });
    }
};

module.exports = {
    getAllTodos, createTodo, updateTodo, deleteTodo,
    getAllChatMessages, sendMessage, markMessagesAsRead,
    createSharedLink,
};
