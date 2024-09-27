const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Quiz = require('../models/quiz');

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/index", (req, res) => {
    res.render("index");
});
router.get("/contact", (req, res) => {
    res.render("contact");
});


router.get("/register", (req, res) => {
    res.render("register");
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/register", async (req, res) => {
    const { fname, lname, email, phone, password, cpassword } = req.body;

    if (password !== cpassword) {
        return res.send("Passwords do not match");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.send('Email already in use');
    }

    const newUser = new User({ fname, lname, email, phone, password });
    try {
        await newUser.save();
        console.log("User registered successfully");
        return res.render('index');
    } catch (err) {
        console.log(err);
        res.status(500).send("Error registering user");
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && user.password.trim() === password.trim()) {
            req.session.email = user.email;
            req.session.fname = user.fname;
            return res.render('home', { fname: user.fname });
        } else {
            return res.send("Invalid email or password");
        }
    } catch (error) {
        return res.send("Invalid login details");
    }
});
function ensureAuthenticated(req, res, next) {
    if (req.session.email) {
        return next();
    } else {
        res.redirect('/login');
    }
}

router.get('/home', ensureAuthenticated, (req, res) => {
    res.render('home', { fname: req.session.fname }); 
});

router.get('/create-quiz', ensureAuthenticated, (req, res) => {
    res.render('create-quiz', { fname: req.session.fname }); 
});

router.post('/create-quiz', ensureAuthenticated,async (req, res) => {
    const { title, description, questions } = req.body;

    try {
        const newQuiz = new Quiz({
            title,
            description,
            questions: questions.map(q => ({
                questionText: q.questionText,
                options: q.options.map((opt, index) => ({
                    text: opt.text,
                    isCorrect: index == q.correctOption
                }))
            }))
        });

        await newQuiz.save();
        res.redirect('home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating quiz');
    }
});

router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find(); 
        res.render('quizzes', { quizzes }); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching quizzes');
    }
});

router.get('/take-quiz/:quizId', async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await Quiz.findById(quizId); 
        if (!req.session.quizProgress) {
            req.session.quizProgress = {};
        }
            if (!req.session.quizProgress[quizId]) {
                req.session.quizProgress[quizId] = { currentQuestion: 0 };
            }
            const currentQuestionIndex = req.session.quizProgress[quizId].currentQuestion;
        res.render('takeQuiz', { 
            quiz,
            currentQuestionIndex
         }); 
    } catch (error) {
        es.status(500).send('Error loading quiz');
    }
});

router.post('/submit-quiz/:quizId', async (req, res) => {
    const quizId = req.params.quizId;
    const userAnswers = req.body.answers;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).send('Quiz not found');
        }

        let score = 0;
        const resultDetails = [];

        quiz.questions.forEach((question, qIndex) => {
            const correctOptionIndex = question.options.findIndex(option => option.isCorrect);
            const isCorrect = userAnswers[qIndex] == correctOptionIndex;
            if (isCorrect) {
                score++;
            }

            resultDetails.push({
                questionText: question.questionText,
                options: question.options,
                correctOptionIndex,
                userSelectedOption: userAnswers[qIndex],
                isCorrect
            });
        });

        res.render('quizResults', {
            quizTitle: quiz.title,
            score,
            totalQuestions: quiz.questions.length,
            resultDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error submitting quiz');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

module.exports = router;
