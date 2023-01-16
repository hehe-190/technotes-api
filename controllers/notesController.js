const User = require('../models/User')
const Note = require('../models/Note')
// const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = async (req, res) => {
    const notes = await Note.find().lean()
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found'})
    }
    
    const noteWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return {...note, username: user.username}
    }))

    res.json(noteWithUser)
}
 
// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res) => {
    const { user, title, text } = req.body
     
    // Confirm data
    if(!user || !title || !text){
        return res.status(400).json({message: 'All fields are required'})
    }

    // Check for duplicate
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if(duplicate) {
        return res.status(409).json({ message: 'Duplicate note title'})
    }

    // Create and store new note
    const note = await Note.create({ user, title, text})
    if(note) {
        res.status(201).json({ message: `New note created`})
    } else {
        res.status(400).json({ message: 'Invalid note data received'})
    }
}

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if(!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required'})
    }

    const note = await Note.findById(id).exec()

    if(!note){
        return res.status(400).json({ message: 'Note not found'})
    }

    // Check for duplicate
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()
    // Allow updates to the original user
    if(duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updateNote = await note.save()

    res.json({ message: `${updateNote.title} updated` })
}

// @desc Delete a note
// @route DELETE /users
// @access Private
const deleteNote = async (req, res) => {
    const { id } = req.body

    if(!id) {
        return res.status(400).json({ message: 'Note ID Required' })
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message: 'Note not found' }) 
    }

    const result = await Note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote, 
    deleteNote
}