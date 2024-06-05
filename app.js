const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const session = require('express-session');  
const crypto = require('crypto');
require("dotenv").config();
const app = express();

// 비밀 키 생성
const secretKey = crypto.randomBytes(64).toString('hex');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views')); 
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 세션 설정
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

const PORT = 8000;
const NODE1 = process.env.NODE1;
const NODE2 = process.env.NODE2;
const FAST1 = process.env.FAST1;
const FAST2 = process.env.FAST2;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/chat', async (req, res) => {
    try {
        const response = await axios.get(`${FAST1}gemini_chat_log`); 
        const data = response.data.response;
        const hideButtons = req.session.hideButtons || false;

        const user_response = await axios.get(`${FAST2}getuser/1`); 
        const user_data = user_response.data.response;
        res.render('chat.ejs', { messages: data, hideButtons, user: user_data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/question', async (req, res) => {
    try {
        const question = req.body.question;
        const response = await axios.post(`${FAST1}gemini_api`, { question: question });
        
        // 채팅 서비스로의 요청이 완료된 후에 리다이렉트를 수행
        res.redirect('/chat');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/insert', async (req, res) => {
    try {
        await axios.post(`${FAST1}gemini_plan_save`, { question: "좋아 계획에 추가할게🥰" });
        const encodedQuery = encodeURIComponent(req.query.response);
        await axios.get(`${FAST2}gemini_test?inputText=${encodedQuery}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        req.session.hideButtons = true;  // 버튼 숨김 상태 저장
        res.redirect('/chat');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/other', async (req, res) => {
    try {
        const question = req.body.response;
        const response = await axios.post(`${FAST1}gemini_api_re`, { question: question });
        
        // 채팅 서비스로의 요청이 완료된 후에 리다이렉트를 수행
        res.redirect('/chat');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/mypage', async (req, res) => {
    try {
        const response = await axios.get(`${FAST2}getuser/1`); 
        const data = response.data.response; 
        res.render('mypage.ejs', { user: data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
