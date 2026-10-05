document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     初期データ
  ======================================== */

  const defaultData = {
    schoolItems: [
      "教科書",
      "ノート",
      "筆箱",
      "水筒",
      "給食セット"
    ],

    outingItems: [
      "財布",
      "スマートフォン",
      "鍵",
      "ハンカチ",
      "ティッシュ"
    ],

    checks: {
      school: [],
      outing: []
    },

    timetable: {
      月: ["国語", "数学", "英語", "理科", "体育"],
      火: ["数学", "社会", "国語", "音楽", "英語"],
      水: ["英語", "理科", "数学", "国語", "体育"],
      木: ["社会", "英語", "国語", "数学", "美術"],
      金: ["数学", "国語", "理科", "英語", "体育"]
    },

    notification: false,
    notificationTime: "07:30"
  };


  let data = loadData();

  let calendarDate = new Date();

  let selectedDate = new Date();


  /* ========================================
     データ保存
  ======================================== */

  function loadData() {

    try {

      const saved =
        localStorage.getItem("forgetCheckData");

      if (!saved) {
        return structuredClone(defaultData);
      }

      return {
        ...structuredClone(defaultData),
        ...JSON.parse(saved)
      };

    } catch (error) {

      console.error(
        "データ読み込みエラー",
        error
      );

      return structuredClone(defaultData);
    }
  }


  window.saveData = function () {

    localStorage.setItem(
      "forgetCheckData",
      JSON.stringify(data)
    );

    alert("保存しました！");
  };


  /* ========================================
     日付
  ======================================== */

  function updateToday() {

    const now = new Date();

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];

    const text =
      `${now.getFullYear()}年` +
      `${now.getMonth() + 1}月` +
      `${now.getDate()}日` +
      `（${weekdays[now.getDay()]}）`;

    const element =
      document.getElementById("today");

    if (element) {
      element.textContent = text;
    }
  }


  /* ========================================
     ナビゲーション
  ======================================== */

  const navItems =
    document.querySelectorAll(
      ".bottom-nav-item"
    );

  const pages =
    document.querySelectorAll(
      ".main-page"
    );


  function showPage(pageId) {

    pages.forEach(page => {
      page.classList.remove("active");
    });

    const page =
      document.getElementById(pageId);

    if (page) {
      page.classList.add("active");
    }

    navItems.forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === pageId
      );

    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  navItems.forEach(item => {

    item.addEventListener("click", () => {

      const pageId =
        item.dataset.page;

      showPage(pageId);

      if (pageId === "calendarPage") {
        renderCalendar();
      }

      if (pageId === "timetablePage") {
        renderTimetable();
      }

    });

  });


  /* ========================================
     今日の時間割
  ======================================== */

  function renderTodaySchedule() {

    const container =
      document.getElementById(
        "todaySchedule"
      );

    if (!container) return;

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];

    const day =
      weekdays[new Date().getDay()];

    const lessons =
      data.timetable[day] || [];

    if (lessons.length === 0) {

      container.innerHTML = `
        <div class="selected-date-info">
          今日は時間割が登録されていません。
        </div>
      `;

      return;
    }

    container.innerHTML =
      lessons.map((lesson, index) => {

        return `
          <div class="schedule-item">

            <span class="schedule-number">
              ${index + 1}
            </span>

            <span class="schedule-name">
              ${lesson}
            </span>

            <span class="schedule-time">
              ${index === 0 ? "1時間目" : ""}
            </span>

          </div>
        `;

      }).join("");
  }


  /* ========================================
     持ち物
  ======================================== */

  function renderChecklist(
    type,
    containerId
  ) {

    const container =
      document.getElementById(containerId);

    if (!container) return;

    const items =
      type === "school"
        ? data.schoolItems
        : data.outingItems;

    if (!data.checks[type]) {
      data.checks[type] = [];
    }

    container.innerHTML = "";

    items.forEach((item, index) => {

      const checked =
        data.checks[type].includes(index);

      const element =
        document.createElement("div");

      element.className =
        "check-item" +
        (checked ? " checked" : "");

      element.innerHTML = `

        <span class="check-box">
          ${checked ? "✓" : ""}
        </span>

        <span class="item-name">
          ${escapeHTML(item)}
        </span>

      `;

      element.addEventListener(
        "click",
        () => {

          toggleCheck(
            type,
            index
          );

        }
      );

      container.appendChild(element);
    });

    updateProgress();
  }


  function toggleCheck(
    type,
    index
  ) {

    const checks =
      data.checks[type];

    const position =
      checks.indexOf(index);

    if (position >= 0) {

      checks.splice(position, 1);

    } else {

      checks.push(index);

    }

    saveWithoutAlert();

    renderAll();
  }


  window.resetChecks = function(type) {

    data.checks[type] = [];

    saveWithoutAlert();

    renderAll();
  };


  /* ========================================
     達成率
  ======================================== */

  function updateProgress() {

    const schoolTotal =
      data.schoolItems.length;

    const outingTotal =
      data.outingItems.length;

    const schoolChecked =
      data.checks.school.length;

    const outingChecked =
      data.checks.outing.length;

    const total =
      schoolTotal + outingTotal;

    const checked =
      schoolChecked + outingChecked;

    const rate =
      total === 0
        ? 0
        : Math.round(
            checked / total * 100
          );

    const rateElement =
      document.getElementById(
        "achievementRate"
      );

    const circleText =
      document.getElementById(
        "progressCircleText"
      );

    const circle =
      document.getElementById(
        "progressCircle"
      );

    if (rateElement) {
      rateElement.textContent =
        `${rate}%`;
    }

    if (circleText) {
      circleText.textContent =
        `${rate}%`;
    }

    if (circle) {

      const circumference = 264;

      const offset =
        circumference -
        circumference * rate / 100;

      circle.style.strokeDashoffset =
        offset;
    }


    const message =
      document.getElementById(
        "achievementMessage"
      );

    if (message) {

      if (rate === 100) {
        message.textContent =
          "準備完了！いってらっしゃい 👋";

      } else if (rate >= 70) {
        message.textContent =
          "あと少しで準備完了です！";

      } else if (rate >= 30) {
        message.textContent =
          "順調です。忘れ物がないか確認しましょう";

      } else {
        message.textContent =
          "まずは持ち物を確認しましょう";
      }
    }


    const schoolProgress =
      document.getElementById(
        "schoolProgress"
      );

    if (schoolProgress) {

      schoolProgress.textContent =
        `${schoolChecked} / ${schoolTotal}`;
    }
  }


  /* ========================================
     カレンダー
  ======================================== */

  function renderCalendar() {

    const calendar =
      document.getElementById(
        "calendar"
      );

    const monthLabel =
      document.getElementById(
        "calendarMonth"
      );

    if (!calendar || !monthLabel) {
      return;
    }

    const year =
      calendarDate.getFullYear();

    const month =
      calendarDate.getMonth();

    monthLabel.textContent =
      `${year}年${month + 1}月`;

    calendar.innerHTML = "";


    const weekdays =
      [
        "日",
        "月",
        "火",
        "水",
        "木",
        "金",
        "土"
      ];


    weekdays.forEach(day => {

      const element =
        document.createElement("div");

      element.className =
        "calendar-day-name";

      element.textContent = day;

      calendar.appendChild(element);
    });


    const firstDay =
      new Date(
        year,
        month,
        1
      ).getDay();


    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();


    for (
      let i = 0;
      i < firstDay;
      i++
    ) {

      const blank =
        document.createElement("div");

      calendar.appendChild(blank);
    }


    const today =
      new Date();


    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const element =
        document.createElement("div");

      element.className =
        "calendar-day";

      element.textContent = day;


      if (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      ) {

        element.classList.add("today");
      }


      if (
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      ) {

        element.classList.add("selected");
      }


      element.addEventListener(
        "click",
        () => {

          selectedDate =
            new Date(
              year,
              month,
              day
            );

          renderCalendar();

          showSelectedDate();

        }
      );


      calendar.appendChild(element);
    }

    showSelectedDate();
  }


  function showSelectedDate() {

    const element =
      document.getElementById(
        "selectedDateInfo"
      );

    if (!element) return;

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];

    const dateText =
      `${selectedDate.getFullYear()}年` +
      `${selectedDate.getMonth() + 1}月` +
      `${selectedDate.getDate()}日` +
      `（${weekdays[selectedDate.getDay()]}）`;

    element.textContent =
      `${dateText} を選択しています`;
  }


  document
    .getElementById("prevMonth")
    ?.addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() - 1
        );

        renderCalendar();
      }
    );


  document
    .getElementById("nextMonth")
    ?.addEventListener(
      "click",
      () => {

        calendarDate.setMonth(
          calendarDate.getMonth() + 1
        );

        renderCalendar();
      }
    );


  /* ========================================
     時間割
  ======================================== */

  function renderTimetable() {

    const container =
      document.getElementById(
        "timetable"
      );

    if (!container) return;

    const days =
      [
        "月",
        "火",
        "水",
        "木",
        "金"
      ];

    container.innerHTML = "";

    days.forEach(day => {

      const card =
        document.createElement("div");

      card.className =
        "card";

      const lessons =
        data.timetable[day] || [];

      card.innerHTML = `

        <div class="section-heading">

          <div>
            <span class="section-icon blue">
              ${day}
            </span>

            <div>
              <h2>${day}曜日</h2>
              <p>${lessons.length}時間</p>
            </div>
          </div>

        </div>

        ${lessons.map(
          (lesson, index) => `
            <div class="schedule-item">

              <span class="schedule-number">
                ${index + 1}
              </span>

              <span class="schedule-name">
                ${escapeHTML(lesson)}
              </span>

            </div>
          `
        ).join("")}

      `;

      container.appendChild(card);
    });
  }


  /* ========================================
     設定画面
  ======================================== */

  window.showSettingPage =
    function(type) {

      document
        .getElementById("settingsMenu")
        ?.classList.add("hidden");

      document
        .querySelectorAll(".setting-page")
        .forEach(page => {
          page.style.display = "none";
        });

      const map = {
        schedule: "settingSchedule",
        subjects: "settingSubjects",
        outing: "settingOuting",
        data: "settingData"
      };

      const target =
        document.getElementById(
          map[type]
        );

      if (target) {
        target.style.display = "block";
      }
    };


  window.showSettingMenu =
    function() {

      document
        .getElementById("settingsMenu")
        ?.classList.remove("hidden");

      document
        .querySelectorAll(".setting-page")
        .forEach(page => {
          page.style.display = "none";
        });
    };


  /* ========================================
     データ初期化
  ======================================== */

  window.resetAllData =
    function() {

      const result =
        confirm(
          "すべての設定とチェック状態を初期化しますか？"
        );

      if (!result) return;

      data =
        structuredClone(
          defaultData
        );

      saveWithoutAlert();

      renderAll();

      alert("データを初期化しました。");
    };


  /* ========================================
     保存
  ======================================== */

  function saveWithoutAlert() {

    localStorage.setItem(
      "forgetCheckData",
      JSON.stringify(data)
    );
  }


  /* ========================================
     HTMLエスケープ
  ======================================== */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* ========================================
     全体更新
  ======================================== */

  function renderAll() {

    renderTodaySchedule();

    renderChecklist(
      "school",
      "schoolList"
    );

    renderChecklist(
      "outing",
      "outingList"
    );

    renderTimetable();

    updateProgress();
  }


  /* ========================================
     初期化
  ======================================== */

  updateToday();

  renderAll();

  renderCalendar();

});
