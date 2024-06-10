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
const mylocalhost = process.env.LOCAL2;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/login',(req, res)=>{
    res.render('login.ejs')
})

app.get('/chat', async (req, res) => {
    try {
        const response = await axios.get(`${FAST1}getChat`); 
        const data = response.data.response;
        const hideButtons = req.session.hideButtons || false;
        const user_response = await axios.get(`${FAST2}getuser/1`); 
        const user_data = user_response.data.response;
        const response_date = await axios.get(`${FAST2}getUserTripSQL`);
        const tripData = response_date.data.result[0];
        res.render('chat.ejs', { messages: data, hideButtons, user: user_data , trip:tripData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/question', async (req, res) => {
    try {
        const question = req.body.question;
        const response = await axios.post(`${FAST1}geminiApi`, { question: question });
        // 채팅 서비스로의 요청이 완료된 후에 리다이렉트를 수행
        res.redirect('/chat');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/insert', async (req, res) => {
    try {
        await axios.post(`${FAST1}chatSave`, { question: "좋아 계획에 추가할게🥰" });
        const encodedQuery = encodeURIComponent(req.query.response);
        await axios.get(`${FAST2}insertTripPlan?inputText=${encodedQuery}`, {
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
        const response = await axios.post(`${FAST1}geminiApiRe`, { question: question });
        
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
        const response_date = await axios.get(`${FAST2}getUserTripSQL`);
        const tripData = response_date.data.result[0];
        res.render('mypage.ejs', { user: data , trip:tripData});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// 메인 페이지 라우트
app.get("/main", async (req, res) => {
  const today = new Date();
  const responses = await axios.get(`${FAST2}getuser/1`);
  const data = responses.data.response;
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];

  let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  let lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let imageUrl = "../image/bar.jpg";
  let bannerStr = "새로운 여행을 떠나볼까요?";
  try {
      const response = await axios.get(`${FAST2}getUserTripSQL`);

      if (response && response.data && response.data.result && response.data.result.length > 0) {
          const { startdate, enddate, title, banner } = response.data.result[0];
          let start = new Date(startdate);
          firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1).getDay();
          lastDateOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          currentMonth = start.getMonth();
          currentYear = start.getFullYear();
          imageUrl = `data:image/jpeg;base64,${banner}`;
          const dday = Math.ceil((start.getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (dday > 0) {
              bannerStr = title + " D-" + dday;
          } else if (dday == 0) {
              bannerStr = title + " D-DAY";
          } else {
              bannerStr = title + " D+" + Math.abs(dday);
          }
      } else {
          console.error("No data found in the response.");
      }
  } catch (error) {
      console.error("Error fetching data:", error);
  }

  let datetripplan;

  app.get(`${FAST2}/getTripPlanSQL`, async (req, res) => {
      const { select_date } = req.query;

      try {
          const response_date = await axios.get(
              `${FAST2}/getTripPlanSQL?select_date=${select_date}`
          );
          datetripplan = response_date.data;
          res.json(response_date.data);
      } catch (error) {
          console.error("Error fetching trip plan data:", error);
          res.status(500).json({ error: "Error fetching trip plan data" });
      }
  });

  res.render("main.ejs", {
      monthNames: monthNames,
      currentMonth: currentMonth,
      currentYear: currentYear,
      firstDayOfMonth: firstDayOfMonth,
      lastDateOfMonth: lastDateOfMonth,
      imageUrl: imageUrl,
      bannerStr: bannerStr,
      datetripplan: datetripplan,
      mylocalhost: mylocalhost,  // 환경 변수를 사용하도록 수정
      user: data
  });
});