document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     初期データ
  ======================================== */

  const DEFAULT_THEME_COLOR = "#4f7cff";

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
      金: ["数学", "国語", "理科", "英語", "体育"],
      土: ["数学", "国語", "理科", "英語", "体育"],
    },

    events: {},

    notification: false,

    notificationTime: "07:30",

    notificationMessage:
      "忘れ物がないか確認しましょう！",

    lastNotificationDate: "",

    /* ★ テーマカラー */
    themeColor: DEFAULT_THEME_COLOR
  };


  let data = loadData();

  let calendarDate = new Date();

  let selectedDate = new Date();

  let completionShown = false;

  let notificationCheckTimer = null;


  /* ========================================
     データ読み込み
  ======================================== */

  function loadData() {

    try {

      const saved =
        localStorage.getItem(
          "forgetCheckData"
        );

      if (!saved) {

        return structuredClone(
          defaultData
        );

      }

      const parsed =
        JSON.parse(saved);

      return {

        ...structuredClone(
          defaultData
        ),

        ...parsed,

        checks: {
          ...structuredClone(
            defaultData.checks
          ),
          ...(parsed.checks || {})
        },

        timetable: {
          ...structuredClone(
            defaultData.timetable
          ),
          ...(parsed.timetable || {})
        },

        events: {
          ...(parsed.events || {})
        },

        themeColor:
          parsed.themeColor ||
          DEFAULT_THEME_COLOR

      };

    } catch (error) {

      console.error(
        "データ読み込みエラー",
        error
      );

      return structuredClone(
        defaultData
      );

    }

  }


  /* ========================================
     保存
  ======================================== */

  window.saveData = function () {

    saveWithoutAlert();

    alert(
      "設定を保存しました！"
    );

  };


  function saveWithoutAlert() {

    localStorage.setItem(
      "forgetCheckData",
      JSON.stringify(data)
    );

  }


  /* ========================================
     色関連
  ======================================== */

  function normalizeHexColor(color) {

    if (
      typeof color !== "string"
    ) {

      return DEFAULT_THEME_COLOR;

    }

    const value =
      color.trim();

    if (
      /^#[0-9a-fA-F]{6}$/.test(
        value
      )
    ) {

      return value.toLowerCase();

    }

    if (
      /^#[0-9a-fA-F]{3}$/.test(
        value
      )
    ) {

      return (
        "#" +
        value
          .slice(1)
          .split("")
          .map(char => char + char)
          .join("")
          .toLowerCase()
      );

    }

    return DEFAULT_THEME_COLOR;

  }


  function hexToRgb(hex) {

    const normalized =
      normalizeHexColor(hex);

    return {

      r: parseInt(
        normalized.slice(1, 3),
        16
      ),

      g: parseInt(
        normalized.slice(3, 5),
        16
      ),

      b: parseInt(
        normalized.slice(5, 7),
        16
      )

    };

  }


  function rgbToHex(
    r,
    g,
    b
  ) {

    return (
      "#" +
      [r, g, b]
        .map(value =>
          Math.max(
            0,
            Math.min(
              255,
              Math.round(value)
            )
          )
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
    );

  }


  /*
    選択した色を少し暗くした色を作る
  */
  function makeDarkColor(hex) {

    const {
      r,
      g,
      b
    } = hexToRgb(hex);

    return rgbToHex(
      r * 0.78,
      g * 0.78,
      b * 0.78
    );

  }


  /*
    選択した色を薄くした色を作る
  */
  function makeLightColor(hex) {

    const {
      r,
      g,
      b
    } = hexToRgb(hex);

    const mix = 0.88;

    return rgbToHex(
      r * (1 - mix) + 255 * mix,
      g * (1 - mix) + 255 * mix,
      b * (1 - mix) + 255 * mix
    );

  }


  /*
    CSS変数へテーマカラーを反映
  */
  function applyThemeColor(color) {

    const normalized =
      normalizeHexColor(color);

    const dark =
      makeDarkColor(
        normalized
      );

    const light =
      makeLightColor(
        normalized
      );


    document.documentElement.style.setProperty(
      "--primary",
      normalized
    );

    document.documentElement.style.setProperty(
      "--primary-dark",
      dark
    );

    document.documentElement.style.setProperty(
      "--primary-light",
      light
    );


    /*
      ブラウザのテーマカラーも変更
    */

    const themeMeta =
      document.querySelector(
        'meta[name="theme-color"]'
      );

    if (themeMeta) {

      themeMeta.setAttribute(
        "content",
        normalized
      );

    }


    /*
      設定画面の表示を更新
    */

    const preview =
      document.getElementById(
        "themePreviewColor"
      );

    if (preview) {

      preview.style.background =
        normalized;

    }


    const code =
      document.getElementById(
        "themeColorCode"
      );

    if (code) {

      code.textContent =
        normalized;

    }


    const picker =
      document.getElementById(
        "customThemeColor"
      );

    if (picker) {

      picker.value =
        normalized;

    }


    /*
      プリセットの選択状態
    */

    document
      .querySelectorAll(
        ".theme-color-button"
      )
      .forEach(button => {

        const buttonColor =
          normalizeHexColor(
            button.dataset.color
          );

        button.classList.toggle(
          "active",
          buttonColor === normalized
        );

      });

  }


  /*
    テーマカラーを変更
  */
  function changeThemeColor(color) {

    const normalized =
      normalizeHexColor(color);

    data.themeColor =
      normalized;

    applyThemeColor(
      normalized
    );

    saveWithoutAlert();

  }


  /*
    テーマ設定UI
  */
  function setupThemeColor() {

    applyThemeColor(
      data.themeColor ||
      DEFAULT_THEME_COLOR
    );


    /*
      プリセット
    */

    document
      .querySelectorAll(
        ".theme-color-button"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            changeThemeColor(
              button.dataset.color
            );

          }
        );

      });


    /*
      自由色
    */

    const picker =
      document.getElementById(
        "customThemeColor"
      );

    if (picker) {

      picker.addEventListener(
        "input",
        () => {

          changeThemeColor(
            picker.value
          );

        }
      );

    }


    /*
      デフォルトへ戻す
    */

    const resetButton =
      document.getElementById(
        "resetThemeColor"
      );

    if (resetButton) {

      resetButton.addEventListener(
        "click",
        () => {

          changeThemeColor(
            DEFAULT_THEME_COLOR
          );

        }
      );

    }

  }


  /* ========================================
     日付
  ======================================== */

  function getDateKey(date) {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;

  }


  function formatDateJapanese(date) {

    const weekdays = [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];

    return (
      `${date.getFullYear()}年` +
      `${date.getMonth() + 1}月` +
      `${date.getDate()}日` +
      `（${weekdays[date.getDay()]}）`
    );

  }


  function updateToday() {

    const element =
      document.getElementById(
        "today"
      );

    if (!element) return;

    element.textContent =
      formatDateJapanese(
        new Date()
      );

  }


  /* ========================================
     HTMLエスケープ
  ======================================== */

  function escapeHTML(value) {

    return String(value ?? "")
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

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

      page.classList.remove(
        "active"
      );

    });


    const page =
      document.getElementById(
        pageId
      );

    if (page) {

      page.classList.add(
        "active"
      );

    }


    navItems.forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === pageId
      );

    });


    if (
      pageId === "calendarPage"
    ) {

      renderCalendar();

    }


    if (
      pageId === "timetablePage"
    ) {

      renderTimetable();

    }


    if (
      pageId === "settings"
    ) {

      showSettingMenu();

    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  navItems.forEach(item => {

    item.addEventListener(
      "click",
      () => {

        showPage(
          item.dataset.page
        );

      }
    );

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
      weekdays[
        new Date().getDay()
      ];


    const lessons =
      data.timetable[day] || [];


    if (
      lessons.length === 0
    ) {

      container.innerHTML = `
        <div class="selected-date-info">
          今日は時間割が登録されていません。
        </div>
      `;

      return;

    }


    container.innerHTML =
      lessons.map(
        (lesson, index) => {

          return `
            <div class="schedule-item">

              <span class="schedule-number">
                ${index + 1}
              </span>

              <span class="schedule-name">
                ${escapeHTML(lesson)}
              </span>

              <span class="schedule-time">
                ${index + 1}時間目
              </span>

            </div>
          `;

        }
      ).join("");

  }


  /* ========================================
     持ち物
  ======================================== */

  function renderChecklist(
    type,
    containerId
  ) {

    const container =
      document.getElementById(
        containerId
      );

    if (!container) return;


    const items =
      type === "school"
        ? data.schoolItems
        : data.outingItems;


    if (!data.checks[type]) {

      data.checks[type] = [];

    }


    data.checks[type] =
      data.checks[type].filter(
        index =>
          index >= 0 &&
          index < items.length
      );


    container.innerHTML = "";


    if (items.length === 0) {

      container.innerHTML = `
        <div class="selected-date-info">
          持ち物が登録されていません。
        </div>
      `;

      updateProgress();

      return;

    }


    items.forEach(
      (item, index) => {

        const checked =
          data.checks[type].includes(
            index
          );


        const element =
          document.createElement(
            "div"
          );


        element.className =
          "check-item" +
          (
            checked
              ? " checked"
              : ""
          );


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


        container.appendChild(
          element
        );

      }
    );


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

      checks.splice(
        position,
        1
      );

    } else {

      checks.push(index);

    }


    saveWithoutAlert();

    renderAll();

  }


  window.resetChecks =
    function(type) {

      data.checks[type] = [];

      completionShown = false;

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
      schoolTotal +
      outingTotal;


    const checked =
      schoolChecked +
      outingChecked;


    const rate =
      total === 0
        ? 0
        : Math.round(
            checked /
            total *
            100
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
        circumference *
        rate /
        100;

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


    if (rate === 100) {

      playCompletionEffect();

    }


    if (rate < 100) {

      completionShown = false;

    }

  }


  /* ========================================
     100%達成演出
  ======================================== */

  function playCompletionEffect() {

    if (completionShown) {
      return;
    }


    completionShown = true;


    document.body.classList.remove(
      "completion-effect"
    );


    void document.body.offsetWidth;


    document.body.classList.add(
      "completion-effect"
    );


    if (
      "vibrate" in navigator &&
      typeof navigator.vibrate ===
        "function"
    ) {

      navigator.vibrate([
        150,
        80,
        250,
        100,
        350
      ]);

    }


    setTimeout(
      () => {

        document.body.classList.remove(
          "completion-effect"
        );

      },
      1900
    );

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


    if (
      !calendar ||
      !monthLabel
    ) {

      return;

    }


    const year =
      calendarDate.getFullYear();


    const month =
      calendarDate.getMonth();


    monthLabel.textContent =
      `${year}年${month + 1}月`;


    calendar.innerHTML = "";


    const weekdays = [
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
        document.createElement(
          "div"
        );

      element.className =
        "calendar-day-name";

      element.textContent =
        day;

      calendar.appendChild(
        element
      );

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
        document.createElement(
          "div"
        );

      calendar.appendChild(
        blank
      );

    }


    const today =
      new Date();


    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "calendar-day";


      element.innerHTML =
        `<span>${day}</span>`;


      const currentDate =
        new Date(
          year,
          month,
          day
        );


      const dateKey =
        getDateKey(
          currentDate
        );


      const events =
        data.events[dateKey] ||
        [];


      if (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      ) {

        element.classList.add(
          "today"
        );

      }


      if (
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      ) {

        element.classList.add(
          "selected"
        );

      }


      if (
        currentDate.getDay() === 6
      ) {

        element.classList.add(
          "saturday"
        );

      }


      if (
        currentDate.getDay() === 0
      ) {

        element.classList.add(
          "sunday"
        );

      }


      if (events.length > 0) {

        const indicator =
          document.createElement(
            "span"
          );

        indicator.className =
          "event-indicator";

        element.appendChild(
          indicator
        );

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

        }
      );


      calendar.appendChild(
        element
      );

    }


    showSelectedDate();

  }


  function showSelectedDate() {

    const element =
      document.getElementById(
        "selectedDateInfo"
      );


    if (!element) return;


    const dateKey =
      getDateKey(
        selectedDate
      );


    const events =
      data.events[dateKey] ||
      [];


    const dateText =
      formatDateJapanese(
        selectedDate
      );


    let html = `

      <strong>
        ${escapeHTML(dateText)}
      </strong>

    `;


    if (events.length === 0) {

      html += `

        <div style="margin-top:6px;">
          予定はありません。
        </div>

      `;

    } else {

      html += `

        <div style="margin-top:10px;">
          <strong>
            📅 予定
          </strong>
        </div>

      `;


      events.forEach(
        (event, index) => {

          const time =
            event.start
              ? event.end
                ? `${event.start}〜${event.end}`
                : event.start
              : "時間未設定";


          html += `

            <div class="event-item-row">

              <div class="event-main">

                <span class="event-title">
                  ${escapeHTML(
                    event.title
                  )}
                </span>

                <span class="event-meta">
                  ${escapeHTML(time)}
                  ${
                    event.memo
                      ? ` ・ ${escapeHTML(event.memo)}`
                      : ""
                  }
                </span>

              </div>

              <div class="event-actions">

                <button
                  class="small-action-btn"
                  type="button"
                  data-event-edit="${index}"
                >
                  ✏️
                </button>

                <button
                  class="small-action-btn delete"
                  type="button"
                  data-event-delete="${index}"
                >
                  🗑
                </button>

              </div>

            </div>

          `;

        }
      );

    }


    html += `

      <button
        id="addEventButton"
        class="calendar-add-btn"
        type="button"
      >
        ＋ この日に予定を追加
      </button>

      <div
        id="calendarEventForm"
        class="editor-form"
        style="display:none;"
      ></div>

    `;


    element.innerHTML = html;


    document
      .getElementById(
        "addEventButton"
      )
      ?.addEventListener(
        "click",
        () => {

          renderEventForm();

        }
      );


    element
      .querySelectorAll(
        "[data-event-edit]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.eventEdit
              );

            renderEventForm(
              index
            );

          }
        );

      });


    element
      .querySelectorAll(
        "[data-event-delete]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.eventDelete
              );

            deleteEvent(
              index
            );

          }
        );

      });

  }


  function renderEventForm(
    editIndex = null
  ) {

    const form =
      document.getElementById(
        "calendarEventForm"
      );


    if (!form) return;


    const dateKey =
      getDateKey(
        selectedDate
      );


    const events =
      data.events[dateKey] ||
      [];


    const existing =
      editIndex !== null
        ? events[editIndex]
        : null;


    form.style.display =
      "block";


    form.innerHTML = `

      <label class="editor-label">
        予定名
      </label>

      <input
        id="eventTitleInput"
        class="editor-input"
        type="text"
        placeholder="例：塾、病院、テスト"
        value="${escapeHTML(
          existing?.title || ""
        )}"
      >


      <div class="editor-row">

        <div>

          <label class="editor-label">
            開始時刻
          </label>

          <input
            id="eventStartInput"
            class="editor-input"
            type="time"
            value="${escapeHTML(
              existing?.start || ""
            )}"
          >

        </div>


        <div>

          <label class="editor-label">
            終了時刻
          </label>

          <input
            id="eventEndInput"
            class="editor-input"
            type="time"
            value="${escapeHTML(
              existing?.end || ""
            )}"
          >

        </div>

      </div>


      <label
        class="editor-label"
        style="margin-top:12px;"
      >
        メモ
      </label>

      <textarea
        id="eventMemoInput"
        class="editor-textarea"
        placeholder="持ち物や注意事項など"
      >${escapeHTML(
        existing?.memo || ""
      )}</textarea>


      <div class="editor-actions">

        <button
          id="eventCancelButton"
          class="cancel-btn"
          type="button"
        >
          キャンセル
        </button>

        <button
          id="eventSaveButton"
          class="primary-btn"
          type="button"
        >
          ${
            editIndex === null
              ? "予定を追加"
              : "変更を保存"
          }
        </button>

      </div>

    `;


    document
      .getElementById(
        "eventCancelButton"
      )
      ?.addEventListener(
        "click",
        () => {

          showSelectedDate();

        }
      );


    document
      .getElementById(
        "eventSaveButton"
      )
      ?.addEventListener(
        "click",
        () => {

          saveEvent(
            editIndex
          );

        }
      );


    document
      .getElementById(
        "eventTitleInput"
      )
      ?.focus();

  }


  function saveEvent(
    editIndex
  ) {

    const title =
      document
        .getElementById(
          "eventTitleInput"
        )
        ?.value
        .trim();


    const start =
      document
        .getElementById(
          "eventStartInput"
        )
        ?.value ||
      "";


    const end =
      document
        .getElementById(
          "eventEndInput"
        )
        ?.value ||
      "";


    const memo =
      document
        .getElementById(
          "eventMemoInput"
        )
        ?.value
        .trim() ||
      "";


    if (!title) {

      alert(
        "予定名を入力してください。"
      );

      return;

    }


    if (
      start &&
      end &&
      start > end
    ) {

      alert(
        "終了時刻は開始時刻より後にしてください。"
      );

      return;

    }


    const dateKey =
      getDateKey(
        selectedDate
      );


    if (!data.events[dateKey]) {

      data.events[dateKey] = [];

    }


    const eventData = {

      id:
        editIndex !== null
          ? data.events[dateKey][
              editIndex
            ]?.id ||
            createId()
          : createId(),

      title,

      start,

      end,

      memo

    };


    if (editIndex === null) {

      data.events[dateKey].push(
        eventData
      );

    } else {

      data.events[dateKey][
        editIndex
      ] = eventData;

    }


    data.events[dateKey].sort(
      (a, b) => {

        if (!a.start) return 1;

        if (!b.start) return -1;

        return a.start.localeCompare(
          b.start
        );

      }
    );


    saveWithoutAlert();

    renderCalendar();

  }


  function deleteEvent(index) {

    const dateKey =
      getDateKey(
        selectedDate
      );


    const events =
      data.events[dateKey] ||
      [];


    const event =
      events[index];


    if (!event) return;


    const result =
      confirm(
        `「${event.title}」を削除しますか？`
      );


    if (!result) return;


    events.splice(
      index,
      1
    );


    if (
      events.length === 0
    ) {

      delete data.events[
        dateKey
      ];

    }


    saveWithoutAlert();

    renderCalendar();

  }


  function createId() {

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2)
    );

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
   時間割表示（表形式）
======================================== */

function renderTimetable() {
  const container = document.getElementById("timetable");
  if (!container) return;

  const days = ["月", "火", "水", "木", "金"];

  const maxLessons = Math.max(
    0,
    ...days.map(day =>
      Array.isArray(data.timetable[day])
        ? data.timetable[day].length
        : 0
    )
  );

  let html = `
    <div class="timetable-table-wrapper">
      <table class="timetable-table">
        <thead>
          <tr>
            <th class="period-column">時間</th>
            ${days.map(day => `<th>${day}曜日</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  if (maxLessons === 0) {
    html += `
      <tr>
        <td colspan="6" class="empty-timetable">
          時間割が登録されていません。
        </td>
      </tr>
    `;
  } else {
    for (let i = 0; i < maxLessons; i++) {
      html += `
        <tr>
          <th class="period-column">${i + 1}時間目</th>
      `;

      days.forEach(day => {
        const lessons = Array.isArray(data.timetable[day])
          ? data.timetable[day]
          : [];

        const subject = lessons[i] || "";

        html += `
          <td>
            ${subject
              ? `<span class="subject-cell">${escapeHTML(subject)}</span>`
              : `<span class="no-subject">－</span>`
            }
          </td>
        `;
      });

      html += `</tr>`;
    }
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

  /* ========================================
     設定画面
  ======================================== */

  window.showSettingPage =
    function(type) {

      document
        .getElementById(
          "settingsMenu"
        )
        ?.classList.add(
          "hidden"
        );


      document
        .querySelectorAll(
          ".setting-page"
        )
        .forEach(
          page => {

            page.style.display =
              "none";

          }
        );


      const map = {

        schedule:
          "settingSchedule",

        subjects:
          "settingSubjects",

        outing:
          "settingOuting",

        theme:
          "settingTheme",

        data:
          "settingData"

      };


      const target =
        document.getElementById(
          map[type]
        );


      if (target) {

        target.style.display =
          "block";

      }


      if (
        type === "schedule"
      ) {

        renderScheduleSettings();

      }


      if (
        type === "subjects"
      ) {

        renderItemSettings(
          "school"
        );

      }


      if (
        type === "outing"
      ) {

        renderItemSettings(
          "outing"
        );

      }


      if (
        type === "theme"
      ) {

        applyThemeColor(
          data.themeColor ||
          DEFAULT_THEME_COLOR
        );

      }

    };


  window.showSettingMenu =
    function() {

      document
        .getElementById(
          "settingsMenu"
        )
        ?.classList.remove(
          "hidden"
        );


      document
        .querySelectorAll(
          ".setting-page"
        )
        .forEach(
          page => {

            page.style.display =
              "none";

          }
        );

    };


  /* ========================================
     日課表設定
  ======================================== */

  function renderScheduleSettings() {

    const container =
      document.getElementById(
        "scheduleSettings"
      );


    if (!container) return;


    const days = [
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];


    container.innerHTML = "";


    days.forEach(day => {

      const group =
        document.createElement(
          "div"
        );


      group.className =
        "setting-group";


      const lessons =
        data.timetable[day] ||
        [];


      group.innerHTML = `

        <div class="setting-group-title">

          <strong>
            ${day}曜日
          </strong>

        </div>

        <div
          id="lessonList-${day}"
          class="setting-list"
        ></div>

        <button
          class="add-item-btn"
          type="button"
          data-add-lesson="${day}"
        >
          ＋ ${day}曜日に授業を追加
        </button>

      `;


      container.appendChild(
        group
      );


      const list =
        group.querySelector(
          `#lessonList-${day}`
        );


      lessons.forEach(
        (
          lesson,
          index
        ) => {

          appendLessonRow(
            list,
            day,
            index,
            lesson
          );

        }
      );


      group
        .querySelector(
          "[data-add-lesson]"
        )
        ?.addEventListener(
          "click",
          () => {

            addLesson(
              day
            );

          }
        );

    });


    const saveButton =
      document.createElement(
        "button"
      );


    saveButton.className =
      "save-section-btn";


    saveButton.textContent =
      "💾 日課表を保存";


    saveButton.type =
      "button";


    saveButton.addEventListener(
      "click",
      saveScheduleSettings
    );


    container.appendChild(
      saveButton
    );

  }


  function appendLessonRow(
    list,
    day,
    index,
    value
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "setting-list-row";


    row.innerHTML = `

      <span class="setting-list-number">
        ${index + 1}
      </span>

      <input
        class="editor-input"
        type="text"
        value="${escapeHTML(value)}"
        data-lesson-day="${day}"
        data-lesson-index="${index}"
      >

      <button
        class="icon-action"
        type="button"
        title="削除"
      >
        🗑
      </button>

    `;


    row
      .querySelector(
        ".icon-action"
      )
      ?.addEventListener(
        "click",
        () => {

          row.remove();

          renumberLessonRows(
            list
          );

        }
      );


    list.appendChild(
      row
    );

  }


  function renumberLessonRows(
    list
  ) {

    list
      .querySelectorAll(
        ".setting-list-row"
      )
      .forEach(
        (
          row,
          index
        ) => {

          const number =
            row.querySelector(
              ".setting-list-number"
            );


          if (number) {

            number.textContent =
              index + 1;

          }

        }
      );

  }


  function addLesson(day) {

    const list =
      document.getElementById(
        `lessonList-${day}`
      );


    if (!list) return;


    appendLessonRow(
      list,
      day,
      list.children.length,
      ""
    );


    list.lastElementChild
      ?.querySelector(
        "input"
      )
      ?.focus();


    renumberLessonRows(
      list
    );

  }


  function saveScheduleSettings() {

    const days = [
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];


    days.forEach(day => {

      const list =
        document.getElementById(
          `lessonList-${day}`
        );


      if (!list) return;


      const inputs =
        list.querySelectorAll(
          "input"
        );


      data.timetable[day] =
        Array.from(inputs)
          .map(
            input =>
              input.value.trim()
          )
          .filter(
            value => value !== ""
          );

    });


    saveWithoutAlert();

    renderTodaySchedule();

    renderTimetable();

    renderScheduleSettings();


    alert(
      "日課表を保存しました！"
    );

  }


  /* ========================================
     持ち物設定
  ======================================== */

  function renderItemSettings(
    type
  ) {

    const containerId =
      type === "school"
        ? "subjectSettings"
        : "outingSettings";


    const container =
      document.getElementById(
        containerId
      );


    if (!container) return;


    const items =
      type === "school"
        ? data.schoolItems
        : data.outingItems;


    container.innerHTML = `

      <div class="setting-list">

        ${items
          .map(
            (
              item,
              index
            ) => `

              <div
                class="setting-list-row"
              >

                <span class="setting-list-number">
                  ${index + 1}
                </span>

                <input
                  class="editor-input"
                  type="text"
                  value="${escapeHTML(
                    item
                  )}"
                  data-item-index="${index}"
                >

                <button
                  class="icon-action"
                  type="button"
                  data-delete-item="${index}"
                >
                  🗑
                </button>

              </div>

            `
          )
          .join("")}

      </div>


      <button
        class="add-item-btn"
        type="button"
        id="addSettingItem"
      >
        ＋ 持ち物を追加
      </button>


      <button
        class="save-section-btn"
        type="button"
        id="saveSettingItems"
      >
        💾 保存する
      </button>

    `;


    container
      .querySelectorAll(
        "[data-delete-item]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              deleteItem(
                type,
                Number(
                  button.dataset.deleteItem
                )
              );

            }
          );

        }
      );


    container
      .querySelector(
        "#addSettingItem"
      )
      ?.addEventListener(
        "click",
        () => {

          addItem(
            type
          );

        }
      );


    container
      .querySelector(
        "#saveSettingItems"
      )
      ?.addEventListener(
        "click",
        () => {

          saveItemSettings(
            type
          );

        }
      );

  }


  function addItem(type) {

    if (type === "school") {

      data.schoolItems.push(
        "新しい持ち物"
      );

      data.checks.school = [];

      saveWithoutAlert();

      renderItemSettings(
        "school"
      );

    } else {

      data.outingItems.push(
        "新しい持ち物"
      );

      data.checks.outing = [];

      saveWithoutAlert();

      renderItemSettings(
        "outing"
      );

    }

  }


  function deleteItem(
    type,
    index
  ) {

    const items =
      type === "school"
        ? data.schoolItems
        : data.outingItems;


    const item =
      items[index];


    if (!item) return;


    const result =
      confirm(
        `「${item}」を削除しますか？`
      );


    if (!result) return;


    items.splice(
      index,
      1
    );


    if (type === "school") {

      data.checks.school = [];

    } else {

      data.checks.outing = [];

    }


    saveWithoutAlert();

    renderItemSettings(
      type
    );

    renderAll();

  }


  function saveItemSettings(
    type
  ) {

    const containerId =
      type === "school"
        ? "subjectSettings"
        : "outingSettings";


    const container =
      document.getElementById(
        containerId
      );


    if (!container) return;


    const inputs =
      container.querySelectorAll(
        "input[data-item-index]"
      );


    const items =
      Array.from(inputs)
        .map(
          input =>
            input.value.trim()
        )
        .filter(
          value => value !== ""
        );


    if (type === "school") {

      data.schoolItems =
        items;

      data.checks.school = [];

    } else {

      data.outingItems =
        items;

      data.checks.outing = [];

    }


    saveWithoutAlert();

    renderAll();

    renderItemSettings(
      type
    );


    alert(
      "持ち物を保存しました！"
    );

  }


  /* ========================================
     通知設定
  ======================================== */

  const notificationToggle =
    document.getElementById(
      "notificationToggle"
    );


  const notificationTime =
    document.getElementById(
      "notificationTime"
    );


  const notificationMessage =
    document.getElementById(
      "notificationMessage"
    );


  function loadNotificationUI() {

    if (notificationToggle) {

      notificationToggle.checked =
        Boolean(
          data.notification
        );

    }


    if (notificationTime) {

      notificationTime.value =
        data.notificationTime ||
        "07:30";

    }


    if (notificationMessage) {

      notificationMessage.value =
        data.notificationMessage ||
        "忘れ物がないか確認しましょう！";

    }

  }


  if (notificationToggle) {

    notificationToggle.addEventListener(
      "change",
      () => {

        data.notification =
          notificationToggle.checked;

        saveWithoutAlert();

        checkNotification();

      }
    );

  }


  if (notificationTime) {

    notificationTime.addEventListener(
      "change",
      () => {

        data.notificationTime =
          notificationTime.value;

        saveWithoutAlert();

      }
    );

  }


  if (notificationMessage) {

    notificationMessage.addEventListener(
      "input",
      () => {

        data.notificationMessage =
          notificationMessage.value;

        saveWithoutAlert();

      }
    );

  }


  const permissionButton =
    document.getElementById(
      "notificationPermissionButton"
    );


  if (permissionButton) {

    permissionButton.addEventListener(
      "click",
      async () => {

        if (
          !("Notification" in window)
        ) {

          alert(
            "この端末では通知に対応していません。"
          );

          return;

        }


        try {

          const permission =
            await Notification.requestPermission();


          if (
            permission ===
            "granted"
          ) {

            alert(
              "通知を許可しました！"
            );

            checkNotification();

          } else {

            alert(
              "通知が許可されませんでした。"
            );

          }

        } catch (error) {

          console.error(
            error
          );

          alert(
            "通知の許可設定に失敗しました。"
          );

        }

      }
    );

  }


  /* ========================================
     通知チェック
  ======================================== */

  async function checkNotification() {

    if (!data.notification) {
      return;
    }


    if (
      !("Notification" in window)
    ) {
      return;
    }


    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }


    const now =
      new Date();


    const today =
      getDateKey(
        now
      );


    if (
      data.lastNotificationDate ===
      today
    ) {

      return;

    }


    const currentTime =
      `${String(
        now.getHours()
      ).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;


    const notificationTime =
      data.notificationTime ||
      "07:30";


    if (
      currentTime <
      notificationTime
    ) {

      return;

    }


    await showNotification();


    data.lastNotificationDate =
      today;


    saveWithoutAlert();

  }


  async function showNotification() {

    const title =
      "🎒 忘れ物チェック";


    const body =
      data.notificationMessage ||
      "忘れ物がないか確認しましょう！";


    if (
      "serviceWorker" in navigator
    ) {

      try {

        const registration =
          await navigator.serviceWorker.ready;


        await registration.showNotification(
          title,
          {
            body,
            icon: "./icon.png",
            badge: "./icon.png",
            tag: "forget-check-notification",
            renotify: true
          }
        );


        return;

      } catch (error) {

        console.error(
          "Service Worker通知エラー",
          error
        );

      }

    }


    try {

      new Notification(
        title,
        {
          body,
          icon: "./icon.png"
        }
      );

    } catch (error) {

      console.error(
        "通知エラー",
        error
      );

    }

  }


  notificationCheckTimer =
    setInterval(
      checkNotification,
      30000
    );


  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        !document.hidden
      ) {

        checkNotification();

      }

    }
  );


  /* ========================================
     データ初期化
  ======================================== */

  window.resetAllData =
    function() {

      const result =
        confirm(
          "すべての設定・予定・チェック状態を初期化しますか？"
        );


      if (!result) return;


      data =
        structuredClone(
          defaultData
        );


      completionShown =
        false;


      saveWithoutAlert();


      /*
        初期化後もテーマカラーを反映
      */

      applyThemeColor(
        DEFAULT_THEME_COLOR
      );


      loadNotificationUI();

      renderAll();

      renderCalendar();

      showSettingMenu();


      alert(
        "データを初期化しました。"
      );

    };


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

  /*
    保存されているテーマカラーを
    最初に適用
  */

  setupThemeColor();

  loadNotificationUI();

  renderAll();

  renderCalendar();

  checkNotification();

});
