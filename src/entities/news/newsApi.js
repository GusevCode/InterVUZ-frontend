// TODO: раскомментировать и удалить MOCK_NEWS когда бэкенд реализует GET /news
// import { apiRequest } from "../../shared/baseApi";
// export function fetchNews() {
//   return apiRequest("/news");
// }

const MOCK_NEWS = [
  {
    slug: "stend-mgtu-im-n-e-baumana-na-vystavke-navigator-postupleniya-posetili-bolee-1000-chelovek",
    title: "Стенд МГТУ им. Н.Э. Баумана на выставке «Навигатор поступления» посетили более 1000 человек",
    preview_text: "На выставке работали представители Приёмной комиссии",
    published_at: { day: "13", month: "апреля", year: "2026" },
    imagePreview: "https://api.www.bmstu.ru/upload/news/15762/69dcfbce12615.jpg",
    tags: [{ id: 14, slug: "postupausim", title: "Поступающим", color: "#10aa00" }],
    page_url: "/news/stend-mgtu-im-n-e-baumana-na-vystavke-navigator-postupleniya-posetili-bolee-1000-chelovek",
  },
  {
    slug: "bauman-racing-team-pobedila-na-chempionate-rossii",
    title: "Команда Bauman Racing Team победила на чемпионате России по студенческому автоспорту",
    preview_text: "Студенты кафедры СМ7 заняли первое место в командном зачёте среди российских университетов",
    published_at: { day: "10", month: "апреля", year: "2026" },
    imagePreview: "https://picsum.photos/seed/racing/600/360",
    tags: [
      { id: 3, slug: "nauka", title: "Наука", color: "#0055cc" },
      { id: 7, slug: "studenty", title: "Студентам", color: "#cc6600" },
    ],
    page_url: "/news/bauman-racing-team-pobedila-na-chempionate-rossii",
  },
  {
    slug: "otkryta-registraciya-na-letnuyu-shkolu-robototekhniki",
    title: "Открыта регистрация на летнюю школу робототехники МГТУ",
    preview_text: "Школа пройдёт с 1 по 14 июля 2026 года. Участие бесплатное для студентов университета",
    published_at: { day: "8", month: "апреля", year: "2026" },
    imagePreview: "https://picsum.photos/seed/robotics/600/360",
    tags: [{ id: 7, slug: "studenty", title: "Студентам", color: "#cc6600" }],
    page_url: "/news/otkryta-registraciya-na-letnuyu-shkolu-robototekhniki",
  },
  {
    slug: "mgtu-voshlo-v-top-100-mirovyh-universitetov-po-inzhenerii",
    title: "МГТУ вошло в топ-100 мировых университетов по инженерным наукам",
    preview_text: "По данным рейтинга QS World University Rankings by Subject 2026",
    published_at: { day: "5", month: "апреля", year: "2026" },
    imagePreview: "https://picsum.photos/seed/ranking/600/360",
    tags: [{ id: 3, slug: "nauka", title: "Наука", color: "#0055cc" }],
    page_url: "/news/mgtu-voshlo-v-top-100-mirovyh-universitetov-po-inzhenerii",
  },
  {
    slug: "den-otkrytyh-dverey-aprel-2026",
    title: "День открытых дверей МГТУ им. Н.Э. Баумана — апрель 2026",
    preview_text: "Приглашаем абитуриентов и их родителей познакомиться с университетом и факультетами",
    published_at: { day: "1", month: "апреля", year: "2026" },
    imagePreview: "https://picsum.photos/seed/openday/600/360",
    tags: [{ id: 14, slug: "postupausim", title: "Поступающим", color: "#10aa00" }],
    page_url: "/news/den-otkrytyh-dverey-aprel-2026",
  },
  {
    slug: "novaya-laboratoriya-kvantovyh-vychisleniy",
    title: "В МГТУ открылась лаборатория квантовых вычислений совместно с «Росатомом»",
    preview_text: "Новая лаборатория позволит студентам работать с реальным квантовым оборудованием",
    published_at: { day: "28", month: "марта", year: "2026" },
    imagePreview: "https://picsum.photos/seed/quantum/600/360",
    tags: [
      { id: 3, slug: "nauka", title: "Наука", color: "#0055cc" },
      { id: 9, slug: "partnyory", title: "Партнёры", color: "#880088" },
    ],
    page_url: "/news/novaya-laboratoriya-kvantovyh-vychisleniy",
  },
];

export function fetchNews() {
  return Promise.resolve({ items: MOCK_NEWS });
}
