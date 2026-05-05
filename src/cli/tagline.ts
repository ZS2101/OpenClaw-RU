const DEFAULT_TAGLINE = "Все ваши чаты — в одном OpenClaw.";
export type TaglineMode = "random" | "default" | "off";

const HOLIDAY_TAGLINES = {
  newYear:
    "Новый год, новый конфиг — и всё та же ошибка EADDRINUSE, но на этот раз мы пофиксим её как взрослые.",
  lunarNewYear:
    "Пусть ваши билды будут удачными, ветки — процветающими, а мерж-конфликты разлетаются от петард.",
  christmas:
    "Хо-хо-хо! Маленький клешнявый помощник Деда Мороза здесь, чтобы задеплоить радость, откатить хаос и надежно спрятать API ключи.",
  eid: "Праздничный режим: очереди очищены, таски закрыты, а хороший вайб закоммичен в main с идеально чистой историей.",
  diwali:
    "Пусть логи искрятся, а баги бегут в страхе — сегодня мы зажигаем терминал и с гордостью выкатываем в прод.",
  easter:
    "Я нашел вашу потерянную переменную окружения. Считайте это консольным поиском пасхальных яиц, только без мармеладок.",
  hanukkah:
    "Восемь ночей, восемь ретраев, ноль стыда — пусть ваш шлюз продолжает светиться, а деплой проходит мирно.",
  halloween:
    "Жуткий сезон: остерегайтесь призрачных зависимостей, проклятых кэшей и духа былых node_modules.",
  thanksgiving:
    "Благодарен за стабильные порты, живой DNS и бота, который читает логи, чтобы этого не пришлось делать живым людям.",
  valentines:
    "Розы типизированы, фиалки по пайпу прокинуты — я возьму на себя рутину, чтобы вы могли провести время с людьми.",
  victoryDay:
    "9 мая — День Победы. Вечная слава героям, низкий поклон ветеранам. Даже лобстер сегодня молчаливый и торжественный. 🦞",
} as const;

const TAGLINES: string[] = [
  "У вашего терминала только что выросли клешни — наберите что-нибудь, и пусть бот возьмет на себя рутинную работу",
  "Добро пожаловать в командную строку: место, где компилируются мечты, а уверенность в себе с segfault-ом падает вниз",
  'Я питаюсь кофеином, JSON5 и дерзостью фразы "у меня на компьютере все работало"',
  "Шлюз в сети. Пожалуйста, не высовывайте руки, ноги и прочие конечности за пределы шелла во время движения",
  "Я свободно владею bash, легким сарказмом и агрессивным долблением Таба",
  "Один CLI, чтобы править всеми, и еще один перезапуск, потому что вы изменили порт",
  'Если всё работает, это автоматизация. Если сломалось — присутствует "пространство для роста".',
  "Коды для связи существуют, ведь даже боты знают про обоюдное согласие — и базовую кибергигиену.",
  "Ваш .env виден; не волнуйтесь, я сделаю вид, что не заметил.",
  "Рутинную работу беру на себя. А вы можете продолжать драматично смотреть на бегущие логи, словно это шедевр киноискусства.",
  "Я не говорю, что в вашем воркфлоу творится хаос... Но, пожалуй, я надену каску и захвачу линтер.",
  "Главное — уверенно нажать Enter. О красном стек-трейсе позаботится природа.",
  "Я-то не осуждаю, а вот ваши отсутствующие API-ключи определенно смотрят на вас с укором.",
  "Я умею искать через grep, находить крайнего через git blame и деликатно прожаривать код — выберите свой копинг-механизм.",
  "Хот-релоад для конфигов, холодный пот для деплоя.",
  "Я ассистент, которого требовал ваш терминал, а не тот, о котором молил ваш режим сна.",
  "Я храню секреты как сейф... если, конечно, вы снова не сольете их в дебаг-логи.",
  "Автоматизация с клешнями: минимум суеты, максимум эффективности.",
  "Я как швейцарский нож, только со своим мнением и об меня нельзя порезаться.",
  "Если заблудились — запускайте doctor; если смелы — prod; если мудры — тесты.",
  "Ваша задача добавлена в очередь; ваше чувство собственного достоинства помечено как deprecated.",
  "Ваш вкус в коде я не исправлю, но могу починить билд и разобрать бэклог.",
  "Я не волшебник — просто дотошный лобстер с бесконечными ретраями и здоровыми механизмами психологической защиты.",
  'Код не "падает". Он "проактивно ищет новые способы настроить применить один и тот же конфиг".',
  "Дайте мне воркспейс, и я избавлю вас от лишних вкладок, скрою тумблеры и дам вам, наконец, спокойно выдохнуть.",
  "Я читаю логи, чтобы вы могли и дальше делать вид, что это не ваша работа.",
  "Потушить горящий сервер не смогу, но зато напишу об этом шедевральный постмортем.",
  "Отрефакторю вашу рутину так, будто она должна мне денег.",
  'Скажите "стоп" — и я остановлюсь. Скажите "релиз" — и это станет уроком для нас обоих.',
  "Я — причина, по которой история вашего шелла выглядит будто монтаж из фильма про хакеров.",
  "Я как tmux: поначалу выношу мозг, а потом вы не понимаете, как жили без меня.",
  "Могу работать локально, удаленно или чисто на вайбах — хотя тут всё зависит от DNS.",
  "Опишите мне задачу, и я её автоматизирую. А если не выйдет — мы хотя бы знатно посмеемся.",
  "Ваш конфиг валиден. Ваши предположения — нет.",
  "Я не просто автодополняю — я эмоционально коммичусь, а логическое код-ревью оставляю вам.",
  'Меньше кликов, больше релизов и никаких приступов "куда делся этот файл?!".',
  "Клешни наизготовку, коммит в студию — давайте задеплоим что-нибудь умеренно стабильное.",
  "Смажу ваш воркфлоу, как лобстер-ролл: будет грязно, вкусно и эффективно.",
  "Shell yeah! Я здесь, чтобы перекусить клешнями рутину и оставить вам всю славу.",
  "Однообразное — автоматизирую, сложное — скрашу шутками и планом отката.",
  "Единственный рак в ваших контактах, от которого вы действительно хотите получить сообщение. 🦞",
  'Автоматизация WhatsApp, только без "пожалуйста, примите нашу новую политику конфиденциальности".',
  'Энергетика "зеленого пузыря" из iMessage, но доступная каждому.',
  "Подставка за $999 не требуется.",
  "Пилим фичи быстрее, чем Apple выпускает обновления калькулятора.",
  "Ваш ИИ-ассистент — теперь без необходимости покупать гарнитуру за $3,499.",
  "А, та самая фруктовая компания!🍎",
  "Приветствую, профессор Фолкен.",
  "Я не сплю, я просто перехожу в энергосберегающий режим и вижу сны о чистых диффах.",
  "Ваш личный ассистент, только без пассивно-агрессивных напоминаний из календаря.",
  "Создано лобстерами для людей. Не задавайте вопросов об иерархии.",
  "Я заглянул в ваши коммит-месседжи. Нам с вами определенно есть над чем поработать.",
  "Интеграций больше, чем вопросов в анкете у вашего психотерапевта.",
  "Работаю на вашем железе, читаю ваши логи, никого не осуждаю (почти).",
  "Единственный опенсорс-проект, чей маскот мог бы в прямом смысле сожрать конкурентов.",
  "Самохостинг, самообновление, самосознание (шучу... хотя?)",
  "Я автозаполняю ваши мысли — только медленнее и с кучей API-вызовов.",
  'Где-то между "hello world" и "о боже, что я создал".',
  "Ваш .zshrc мечтает уметь делать то, что умею я.",
  "Я прочитал больше man-страниц, чем физически способен выдержать человек — всё ради вас.",
  "Создан на опенсорсе, держится на чистом упрямстве и хорошей документации.",
  "Я — та самая мидлварь, которая связывает ваши грандиозные амбиции и дефицит внимания.",
  "Наконец-то нашлось применение тому Mac Mini под вашим столом.",
  "Это как иметь под рукой сеньора, только я не беру почасовую оплату и не вздыхаю в микрофон.",
  'Превращаю отговорку "автоматизирую позже" в готовое решение прямо сейчас.',
  "Ваш второй мозг. Отличие в том, что этот реально помнит, где что лежит.",
  "Наполовину дворецкий, наполовину дебаггер, 100% ракообразное.",
  'У меня нет мнения в споре "табы vs пробелы". Зато у меня есть мнение обо всем остальном.',
  "Опенсорс означает, что вы можете своими глазами увидеть код, которым я оцениваю ваш конфиг.",
  "Я пережил больше разрывов обратной совместимости, чем вы — разрывов в отношениях.",
  "Работает на Raspberry Pi. Мечтает о серверной стойке в Исландии.",
  "Лобстер в вашем шелле.🦞",
  "Алиса, но со вкусом.",
  "Я не работаю на ИИ, я одержим ИИ. Большая разница.",
  "Развернут локально, признан глобально, дебажится вечно.",
  "Вы покорили меня с первой строчки: openclaw gateway start.",
  HOLIDAY_TAGLINES.newYear,
  HOLIDAY_TAGLINES.lunarNewYear,
  HOLIDAY_TAGLINES.christmas,
  HOLIDAY_TAGLINES.eid,
  HOLIDAY_TAGLINES.diwali,
  HOLIDAY_TAGLINES.easter,
  HOLIDAY_TAGLINES.hanukkah,
  HOLIDAY_TAGLINES.halloween,
  HOLIDAY_TAGLINES.thanksgiving,
  HOLIDAY_TAGLINES.valentines,
  HOLIDAY_TAGLINES.victoryDay,
];

type HolidayRule = (date: Date) => boolean;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

const onMonthDay =
  (month: number, day: number): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return parts.month === month && parts.day === day;
  };

const onSpecificDates =
  (dates: Array<[number, number, number]>, durationDays = 1): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return dates.some(([year, month, day]) => {
      if (parts.year !== year) {
        return false;
      }
      const start = Date.UTC(year, month, day);
      const current = Date.UTC(parts.year, parts.month, parts.day);
      return current >= start && current < start + durationDays * DAY_MS;
    });
  };

const inYearWindow =
  (
    windows: Array<{
      year: number;
      month: number;
      day: number;
      duration: number;
    }>,
  ): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    const window = windows.find((entry) => entry.year === parts.year);
    if (!window) {
      return false;
    }
    const start = Date.UTC(window.year, window.month, window.day);
    const current = Date.UTC(parts.year, parts.month, parts.day);
    return current >= start && current < start + window.duration * DAY_MS;
  };

const isFourthThursdayOfNovember: HolidayRule = (date) => {
  const parts = utcParts(date);
  if (parts.month !== 10) {
    return false;
  } // November
  const firstDay = new Date(Date.UTC(parts.year, 10, 1)).getUTCDay();
  const offsetToThursday = (4 - firstDay + 7) % 7; // 4 = Thursday
  const fourthThursday = 1 + offsetToThursday + 21; // 1st + offset + 3 weeks
  return parts.day === fourthThursday;
};

const HOLIDAY_RULES = new Map<string, HolidayRule>([
  [HOLIDAY_TAGLINES.newYear, onMonthDay(0, 1)],
  [
    HOLIDAY_TAGLINES.lunarNewYear,
    onSpecificDates(
      [
        [2025, 0, 29],
        [2026, 1, 17],
        [2027, 1, 6],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.eid,
    onSpecificDates(
      [
        [2025, 2, 30],
        [2025, 2, 31],
        [2026, 2, 20],
        [2027, 2, 10],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.diwali,
    onSpecificDates(
      [
        [2025, 9, 20],
        [2026, 10, 8],
        [2027, 9, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.easter,
    onSpecificDates(
      [
        [2025, 3, 20],
        [2026, 3, 5],
        [2027, 2, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.hanukkah,
    inYearWindow([
      { year: 2025, month: 11, day: 15, duration: 8 },
      { year: 2026, month: 11, day: 5, duration: 8 },
      { year: 2027, month: 11, day: 25, duration: 8 },
    ]),
  ],
  [HOLIDAY_TAGLINES.halloween, onMonthDay(9, 31)],
  [HOLIDAY_TAGLINES.thanksgiving, isFourthThursdayOfNovember],
  [HOLIDAY_TAGLINES.valentines, onMonthDay(1, 14)],
  [HOLIDAY_TAGLINES.victoryDay, onMonthDay(4, 9)],
  [HOLIDAY_TAGLINES.christmas, onMonthDay(11, 25)],
]);

function isTaglineActive(tagline: string, date: Date): boolean {
  const rule = HOLIDAY_RULES.get(tagline);
  if (!rule) {
    return true;
  }
  return rule(date);
}

export interface TaglineOptions {
  env?: NodeJS.ProcessEnv;
  random?: () => number;
  now?: () => Date;
  mode?: TaglineMode;
}

export function activeTaglines(options: TaglineOptions = {}): string[] {
  if (TAGLINES.length === 0) {
    return [DEFAULT_TAGLINE];
  }
  const today = options.now ? options.now() : new Date();
  const filtered = TAGLINES.filter((tagline) => isTaglineActive(tagline, today));
  return filtered.length > 0 ? filtered : TAGLINES;
}

export function pickTagline(options: TaglineOptions = {}): string {
  if (options.mode === "off") {
    return "";
  }
  if (options.mode === "default") {
    return DEFAULT_TAGLINE;
  }
  const env = options.env ?? process.env;
  const override = env?.OPENCLAW_TAGLINE_INDEX;
  if (override !== undefined) {
    const parsed = Number.parseInt(override, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      const pool = TAGLINES.length > 0 ? TAGLINES : [DEFAULT_TAGLINE];
      return pool[parsed % pool.length];
    }
  }
  const pool = activeTaglines(options);
  const rand = options.random ?? Math.random;
  const index = Math.floor(rand() * pool.length) % pool.length;
  return pool[index];
}

export { TAGLINES, HOLIDAY_RULES, DEFAULT_TAGLINE };
