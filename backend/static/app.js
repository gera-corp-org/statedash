"use strict";

const $ = (sel) => document.querySelector(sel);
const vizRoot = $(".viz-root");

// Theme: header button > ?theme= > system. The choice is remembered.
const urlParams = new URLSearchParams(location.search);
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return systemDark.matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

applyTheme(localStorage.getItem("statedash-theme") || urlParams.get("theme"));

/* ---------- localisation ---------- */

let lang = (localStorage.getItem("statedash-lang") || urlParams.get("lang")) === "en" ? "en" : "ru";

const I18N = {
  ru: {
    "err.auth_required": "Требуется вход",
    "err.bad_password": "Неверный пароль",
    "err.bad_current_password": "Неверный текущий пароль",
    "err.password_too_short": "Пароль короче 6 символов",
    "err.bad_url": "Адрес должен быть вида https://хост:порт",
    "err.need_key_and_secret": "Нужны и ключ, и секрет",
    "err.connect_failed": "Подключиться не удалось: {n}",
    "err.bad_listen": "Формат: адрес:порт, например 127.0.0.1:8080",
    "err.env_not_writable": "Не удалось записать .env (нет доступа на запись)",
    "err.peer_not_found": "Пир не найден",
    "err.host_not_found": "Хост не найден",
    "err.bad_state_id": "Нужен id состояния вида <state>/<creator>",
    "err.kill_failed": "OPNsense не сбросил состояние: {n}",
    "err.need_two_addresses": "Нужны два корректных адреса",
    "err.bad_address": "Некорректный адрес",
    "app.title": "Statedash — активные хосты",
    "nav.hosts": "Активные хосты",
    "nav.settings": "Настройки",
    "nav.history": "История",
    "hist.hint": "Всё на этой странице — из хранилища, а не текущее состояние. Выбранный промежуток относится ко всем графикам раздела. Линия показывает среднее за интервал, подсказка — пик внутри него. Точка в минуту хранится неделю, точка в час — пять недель.",
    "hist.device": "Устройство",
    "hist.device.none": "По этому устройству за выбранный промежуток данных нет",
    "hist.device.pick": "Выбрать устройство",
    "hist.device.search": "Поиск: имя или адрес",
    "hist.device.vpn": "VPN",
    "hist.device.live": "Сейчас в сети",
    "hist.device.past": "Были раньше",
    "hist.device.nomatch": "Ничего не найдено",
    "sys.title": "Файрвол",
    "sys.cpu": "Процессор",
    "sys.cpu.sub": "польз. {u}% · сист. {s}%",
    "sys.memory": "Память",
    "sys.swap": "Подкачка",
    "sys.temp": "Температура",
    "sys.mbuf": "Буферы сети",
    "sys.states": "Состояния pf",
    "sys.disk": "Диск",
    "sys.near": "близко к пределу",
    "sys.over": "предел",
    "sys.failures": "отказов: {n}",
    "set.access": "Доступ",
    "demo.note": "Витрина: настройки видны, но менять их нельзя — они общие для всех, кто сейчас смотрит. Тема, язык и единицы измерения ваши личные и работают.",
    "err.demo_read_only": "Витрина работает только на чтение",
    "set.listen": "Веб-интерфейс слушает",
    "set.listen.only": "Только эта машина (127.0.0.1)",
    "set.listen.all": "Вся сеть (0.0.0.0)",
    "set.listen.now": "Сейчас работает",
    "set.listen.pending": "Выбрано {n}. Чтобы применить, выполните на сервере: docker compose up -d",
    "set.listen.local": "только с этой машины",
    "set.listen.public": "доступен из сети",
    "set.listen.warn": "⚠ Интерфейс открыт для всей сети, а пароль не задан — любой в сети видит ваш мониторинг.",
    "set.pw.current": "Текущий пароль",
    "set.pw.new": "Новый пароль (от 6 символов)",
    "set.pw.save": "Установить пароль",
    "set.pw.off": "Отключить пароль",
    "set.logout": "Выйти",
    "top.logout": "Выйти",
    "set.pw.on.state": "вход по паролю включён",
    "set.pw.off.state": "пароль не задан — доступ открыт всем в сети",
    "set.pw.saved": "Пароль обновлён",
    "set.pw.removed": "Пароль отключён",
    "set.pw.short": "Пароль короче 6 символов",
    "set.pw.need": "Введите новый пароль",
    "set.pw.wrong": "Неверный текущий пароль",
    "set.cred.hint": "ключи хранятся на сервере и наружу не отдаются",
    "set.cred.url": "Адрес OPNsense",
    "set.cred.tls": "Проверять TLS-сертификат",
    "set.cred.warn": "⚠ Приложение отправляет API-ключ на указанный адрес — меняй его только на адрес своего файрвола.",
    "set.cred.checking": "Проверяю подключение…",
    "set.cred.applied": "Подключение проверено и применено",
    "set.cred.key": "Новый API-ключ",
    "set.cred.secret": "Новый API-секрет",
    "set.cred.save": "Сохранить ключи",
    "set.cred.saved": "Ключи сохранены, подключение перезапущено",
    "set.cred.need": "Заполните и ключ, и секрет",
    "set.env.key": "API-ключ",
    "set.env.secret": "API-секрет",
    "set.env.source.env": "из .env",
    "set.env.source.ui": "задан через интерфейс",
    "set.ui": "Интерфейс",
    "set.lang": "Язык",
    "set.theme": "Тема",
    "set.theme.system": "Системная",
    "set.theme.light": "Светлая",
    "set.theme.dark": "Тёмная",
    "set.units": "Единицы скорости",
    "set.chart": "Показывать график пропускной способности",
    "set.nav": "Свёрнутое левое меню",
    "set.killconfirm": "Спрашивать подтверждение при разрыве соединения",
    "set.timefmt": "Формат времени",
    "set.timefmt.auto": "Как в языке интерфейса",
    "set.timefmt.24": "24 часа (14:30)",
    "set.timefmt.12": "12 часов (2:30 PM)",
    "set.poll": "Опрос OPNsense",
    "set.poll.hint": "применяется сразу, перезапуск не нужен",
    "set.ifaces": "Интерфейсы",
    "set.ifaces.fail": "Не удалось получить список: ",
    "set.ifaces.none": "не выбрано",
    "top.ifaces.title": "Интерфейсы для наблюдения — нажмите, чтобы изменить",
    "top.ifaces.saved": "Интерфейсы обновлены",
    "top.ifaces.last": "Хотя бы один интерфейс должен остаться выбранным",
    "set.poll_seconds": "Период опроса скоростей, с",
    "set.states_seconds": "Период опроса соединений и WireGuard, с",
    "set.enrich_seconds": "Период обновления имён (ARP/DHCP/DNS), с",
    "set.history": "Точек истории графиков",
    "set.spark": "Точек спарклайна",
    "set.idle": "Держать молчащий хост в списке, с",
    "set.connlimit": "Лимит соединений на хост",
    "set.swap": "Поменять местами приём и передачу",
    "set.save": "Сохранить",
    "set.defaults": "Вернуть значения из .env",
    "set.saved": "Сохранено",
    "set.saved.mem": "Применено, но не сохранено на диск (нет тома /srv/data)",
    "set.savefail": "Не удалось сохранить: ",
    "set.view": "Вид таблиц",
    "set.reset.cols": "Сбросить колонки и сортировки",
    "set.reset.all": "Сбросить все локальные настройки",
    "set.conn": "Подключение",
    "set.env.url": "Адрес OPNsense",
    "set.env.mock": "Режим тестовых данных",
    "set.env.tls": "Проверка TLS-сертификата",
    "set.env.note": "меняется в .env и требует перезапуска контейнера",
    "yes": "да",
    "no": "нет",
    "nav.wg": "VPN · WireGuard",
    "nav.blocked": "Заблокировано",
    "blk.title": "Заблокировано",
    "blk.hint": "Собрано из журнала файрвола, а не из таблицы состояний: заблокированный пакет состояния не создаёт. Одинаковые события свёрнуты в группы.",
    "blk.attempt": "Попытки соединения",
    "blk.attempt.hint": "кто-то пытался открыть соединение и получил отказ",
    "blk.late": "Запоздалые пакеты",
    "blk.late.hint": "состояние соединения уже истекло",
    "blk.noise": "Широковещательный шум",
    "blk.noise.hint": "болтовня соседних сегментов",
    "blk.fold": "Свернуть шум",
    "blk.search": "Фильтр: адрес, порт, правило…",
    "blk.empty": "Пока ничего не блокировалось",
    "blk.allnoise": "Всё заблокированное — широковещательный шум, он свёрнут",
    "blk.col.kind": "Вид",
    "blk.col.rule": "Правило",
    "blk.col.src": "Источник",
    "blk.col.srcname": "Имя источника",
    "blk.col.dst": "Назначение",
    "blk.col.service": "Служба",
    "blk.col.count": "Раз",
    "blk.col.last": "Последний",
    "blk.kind.attempt": "попытка",
    "blk.kind.late": "запоздалый",
    "blk.kind.broadcast": "широковещательный",
    "nav.rules": "Правила",
    "rules.title": "Карта трафика: откуда → правило → куда",
    "map.group.fw": "Файрвол",
    "map.group.own": "Сети OPNsense",
    "map.group.wan": "Сети WAN",
    "map.ports.none": "без портов (icmp и т. п.)",
    "map.ports.title": "Порты назначения:",
    "map.col.src": "Сети — откуда",
    "map.col.dnat": "Проброс портов · DNAT",
    "map.col.snat": "Исходящий NAT · SNAT",
    "map.snat.auto": "автоматическое правило",
    "map.col.rules": "Правила — что пропускают",
    "map.col.dst": "Сети — куда",
    "map.zone.on": "интерфейс {n}",
    "map.zone.onMany": "интерфейсы: {n}",
    "map.zone.local": "локальная сеть",
    "map.zone.internet": "внешняя сеть",
    "map.zone.multicast": "групповая рассылка",
    "map.zone.ipv6": "IPv6",
    "map.zone.unknown": "не определено",
    "map.legend.nat": "пунктир — на этом пути подменяется адрес (NAT)",
    "rules.search.ph": "Фильтр: правило, адрес…",
    "rules.empty": "Данных пока нет — ждём опрос состояний…",
    "rules.foot": "строится по таблице состояний pf · обновление каждые 10 с · клик по правилу — его соединения",
    "cfg.title": "Настроенные правила",
    "cfg.kind.filter": "Фильтрация",
    "cfg.kind.snat": "Исходящий NAT",
    "cfg.hideauto": "Скрыть автоправила",
    "cfg.h.action": "Действие",
    "cfg.h.nat": "Подмена на",
    "cfg.h.iface": "Интерфейс",
    "cfg.h.src": "Источник",
    "cfg.h.dst": "Назначение",
    "cfg.h.descr": "Описание",
    "cfg.h.use": "Сейчас",
    "cfg.active": "{n} соед.",
    "cfg.idle": "нет трафика",
    "cfg.off": "выключено",
    "cfg.auto": "автоправило",
    "cfg.empty": "Правил нет",
    "cfg.nat.wanaddr": "адрес WAN",
    "cfg.nat.hint": "Адрес, на который подменяется источник",
    "cfg.noaccess": "Нет доступа к правилам — выдайте пользователю привилегии «Firewall: Rules [new]» и «Firewall: NAT: Source NAT»",
    "cfg.error": "Не удалось получить правила: ",
    "rules.nat.out": "маскарад",
    "rules.nat.in": "проброс",
    "rules.help.title": "Как читается путь пакета",
    "rules.help.1": "Проброс портов (Destination NAT) — для входящих: адрес назначения меняется на внутренний.",
    "rules.help.2": "Правила фильтрации (Rules) — пропустить или заблокировать; их имена и показаны ниже.",
    "rules.help.3": "Исходящий NAT (Source NAT) — на выходе адрес источника меняется на адрес файрвола.",
    "rules.help.4": "Схема читается слева направо: сеть-источник → правило → сеть-назначение. Пунктир — на этом пути подменяется адрес (NAT). Наведение подсвечивает только пути этого узла, клик по правилу открывает его соединения.",
    "rules.help.5": "Сети, в которых есть адрес самого OPNsense — интерфейсы, туннели WireGuard и сети из настроенных правил, — собираются в группу «Сети OPNsense» автоматически; сети на WAN-интерфейсах выносятся в отдельную группу «Сети WAN». Под каждой подсетью подписан интерфейс, на котором она работает (берётся из таблицы ARP и из туннелей WireGuard).",
    "rules.help.6": "У каждого правила подписаны порты назначения, по которым сейчас идут соединения (наведите — покажет все порты со службами).",
    "rules.help.7": "Схема повторяет путь пакета: подмена назначения (проброс порта) идёт до правил, подмена источника (исходящий NAT) — после. Если подмены нет, связь просто минует эту колонку.",
    "rules.help.note": "Показано фактическое поведение из таблицы состояний: какие правила реально пропускают трафик и где происходит подмена адресов. Сами конфигурации правил через API OPNsense недоступны.",
    "rules.noname": "без описания",
    "rules.detail": "Правило",
    "flow.internet": "Интернет",
    "flow.other": "прочие сети",
    "flow.otherRules": "остальные правила",
    "flow.multicast": "multicast",
    "flow.conns": "соед.",
    "nav.collapse": "Свернуть",
    "nav.collapse.title": "Свернуть меню",
    "nav.expand.title": "Развернуть меню",
    "top.down": "Загрузка",
    "top.up": "Отдача",
    "top.hosts": "Хостов",
    "badge.mock": "тестовые данные",
    "theme.title": "Переключить тему",
    "chart.title": "Пропускная способность",
    "chart.pick": "Показать только эту линию. Повторное нажатие вернёт все",
    "chart.hide": "Скрыть график",
    "chart.toggle.title": "Показать или скрыть график пропускной способности",
    "sys.tiles.hide": "Скрыть",
    "range.title": "За какой промежуток показывать",
    "range.5m": "5 минут",
    "range.15m": "15 минут",
    "range.30m": "30 минут",
    "range.1h": "1 час",
    "range.3h": "3 часа",
    "range.6h": "6 часов",
    "range.12h": "12 часов",
    "range.24h": "24 часа",
    "range.2d": "2 дня",
    "range.7d": "7 дней",
    "range.30d": "30 дней",
    "range.empty": "За этот промежуток данных пока нет — история копится с момента запуска",
    "err.bad_range": "Такого промежутка нет",
    "tip.peak": "пик",
    "chart.show": "График",
    "sys.tiles.show": "Показать",
    "hosts.title": "Хосты",
    "cols.btn": "Колонки",
    "hosts.speed": "Скорость",
    "unit.kbit": "Кбит/с — биты в секунду",
    "unit.kbyte": "КБ/с — байты в секунду",
    "unit.kbit.short": "Кбит/с",
    "unit.kbyte.short": "КБ/с",
    "search.ph": "Фильтр: имя, IP, MAC…",
    "col.name": "Имя хоста",
    "col.down": "Приём",
    "col.up": "Передача",
    "col.conns": "Подключения",
    "col.addr": "Тип адреса",
    "col.start": "Начало",
    "col.uptime": "В сети",
    "col.idle": "Бездействие",
    "col.iface": "Интерфейс",
    "col.vendor": "Производитель",
    "col.peer": "Топ-собеседник",
    "col.dests": "Назначений",
    "col.peakdown": "Пик приёма",
    "col.peakup": "Пик передачи",
    "addr.dhcp": "DHCP",
    "addr.static": "статический",
    "col.ip": "Адрес IPv4",
    "col.mac": "Адрес MAC",
    "col.spark": "Активность",
    "col.tdown": "Принято [МБ]",
    "col.tup": "Передано [МБ]",
    "hosts.empty": "Пока никого не видно — ждём данные…",
    "foot.a": "обновление каждые",
    "foot.b": "с · клик по строке — детали хоста",
    "tab.general": "Обзор",
    "tab.conns": "Соединения",
    "tab.histo": "Гистограмма",
    "detail.close.title": "Закрыть",
    "detail.resize.title": "Потяни, чтобы изменить высоту; двойной клик — сброс",
    "grip.title": "Потяни, чтобы изменить ширину; двойной клик — сброс",
    "err.opnsense": "Нет связи с OPNsense API: ",
    "err.backend": "Бэкенд недоступен: ",
    "g.name": "Имя хоста",
    "g.ip": "IP-адрес",
    "g.mac": "MAC-адрес",
    "g.vendor": "Производитель",
    "g.conns": "Активных соединений",
    "g.iface": "Интерфейс",
    "g.first": "Впервые замечен",
    "g.down": "Загрузка сейчас",
    "g.up": "Отдача сейчас",
    "g.tdown": "Всего скачано",
    "g.tup": "Всего отдано",
    "g.unknown": "неизвестно",
    "conn.dir": "Направление",
    "conn.rule": "Правило трафика",
    "conn.proto": "Протокол",
    "conn.natvia": "на выходе адрес подменяется на {n}",
    "conn.service": "Служба",
    "conn.src_country": "Страна источника",
    "conn.src_ip": "IP источника",
    "conn.src_name": "Имя источника",
    "conn.src_port": "Порт источника",
    "conn.dst_port": "Порт назначения",
    "conn.dst_country": "Страна назначения",
    "conn.dst_ip": "IP назначения",
    "conn.dst_name": "Имя назначения",
    "conn.gw": "Шлюз",
    "conn.rx": "Приём",
    "conn.tx": "Передача",
    "conn.state": "Состояние",
    "conn.age": "Время",
    "conn.out.title": "Хост сам установил это соединение",
    "conn.in.title": "К хосту подключились извне",
    "conn.local": "Локальный адрес",
    "kill.hint": "Клик — действия над соединением",
    "kill.one": "Разорвать это соединение",
    "kill.confirm": "Соединение будет сброшено на файрволе. Продолжить?",
    "kill.yes": "Да, разорвать (нажмите здесь)",
    "kill.noid": "У этого состояния нет идентификатора — разрыв недоступен",
    "kill.cancel": "Отмена",
    "kill.copy": "Скопировать адреса",
    "kill.failed": "Не удалось: ",
    "kill.dropped": "Сброшено состояний: {n}",
    "conn.hidefw": "Скрыть соединения с файрволом",
    "conn.hiddenfw": "Скрыто соединений с файрволом: {n}",
    "conn.hidelocal": "Скрыть локальные соединения",
    "conn.hiddenlocal": "Скрыто локальных: {n}",
    "conn.allhidden": "Все соединения скрыты фильтрами — снимите галочки выше",
    "conn.loading": "Загружаю…",
    "conn.none": "Активных соединений нет",
    "conn.failed": "Не удалось получить соединения: ",
    "conn.limit": "Показаны первые 300 из {n}",
    "pager.range": "Показано {a}–{b} из {n}",
    "pager.page": "Стр. {p} / {t}",
    "conn.notunnel": "Не удалось определить туннельный IP пира (нет IPv4 в Allowed IPs)",
    "wg.title": "WireGuard — пиры",
    "wg.name": "Имя",
    "wg.status": "Статус",
    "wg.ips": "Разрешённые IP",
    "wg.hs": "Хендшейк",
    "wg.trx": "Всего ↓",
    "wg.ttx": "Всего ↑",
    "wg.online": "в сети",
    "wg.offline": "не в сети",
    "wg.empty": "Пиров нет или данные ещё не пришли…",
    "wg.foot": "обновление каждые 10 с · «в сети» — хендшейк моложе 3 минут",
    "wg.noaccess": "Нет доступа к API WireGuard — добавь пользователю statedash привилегию «VPN: WireGuard: Status» в OPNsense",
    "wg.err": "Ошибка запроса WireGuard: ",
    "wgg.allowed": "Разрешённые IP",
    "wgg.tunnel": "Туннельный IP",
    "wgg.pub": "Публичный ключ",
    "wgg.hs": "Последний хендшейк",
    "wgg.rxnow": "Приём сейчас",
    "wgg.txnow": "Передача сейчас",
    "wgg.trx": "Всего принято",
    "wgg.ttx": "Всего передано",
    "ago.never": "никогда",
    "ago.now": "только что",
    "ago.sec": "{n} с назад",
    "ago.min": "{n} мин назад",
    "ago.hour": "{n} ч назад",
  },
  en: {
    "err.auth_required": "Sign-in required",
    "err.bad_password": "Wrong password",
    "err.bad_current_password": "Wrong current password",
    "err.password_too_short": "Password is shorter than 6 characters",
    "err.bad_url": "The address must look like https://host:port",
    "err.need_key_and_secret": "Both the key and the secret are required",
    "err.connect_failed": "Could not connect: {n}",
    "err.bad_listen": "Format: address:port, for example 127.0.0.1:8080",
    "err.env_not_writable": "Could not write .env (no write access)",
    "err.peer_not_found": "Peer not found",
    "err.host_not_found": "Host not found",
    "err.bad_state_id": "A state id like <state>/<creator> is required",
    "err.kill_failed": "OPNsense did not drop the state: {n}",
    "err.need_two_addresses": "Two valid addresses are required",
    "err.bad_address": "Invalid address",
    "app.title": "Statedash — active hosts",
    "nav.hosts": "Active hosts",
    "nav.settings": "Settings",
    "nav.history": "History",
    "hist.hint": "Everything on this page comes from the store rather than from the moment. The chosen period applies to every chart in the section. The line is the average over each interval and the tooltip names the peak inside it. One point a minute is kept a week, one an hour five weeks.",
    "hist.device": "Device",
    "hist.device.none": "Nothing stored for this device over the chosen period",
    "hist.device.pick": "Choose a device",
    "hist.device.search": "Search: name or address",
    "hist.device.vpn": "VPN",
    "hist.device.live": "On the network now",
    "hist.device.past": "Seen before",
    "hist.device.nomatch": "Nothing matches",
    "sys.title": "Firewall",
    "sys.cpu": "CPU",
    "sys.cpu.sub": "user {u}% · sys {s}%",
    "sys.memory": "Memory",
    "sys.swap": "Swap",
    "sys.temp": "Temperature",
    "sys.mbuf": "Network buffers",
    "sys.states": "pf states",
    "sys.disk": "Disk",
    "sys.near": "near the limit",
    "sys.over": "at the limit",
    "sys.failures": "failures: {n}",
    "set.access": "Access",
    "demo.note": "A demonstration: the settings are visible but cannot be changed — they are shared by everyone looking. Theme, language and units are yours alone and do work.",
    "err.demo_read_only": "The demonstration is read-only",
    "set.listen": "Web interface listens on",
    "set.listen.only": "This machine only (127.0.0.1)",
    "set.listen.all": "Whole network (0.0.0.0)",
    "set.listen.now": "Currently active",
    "set.listen.pending": "Selected {n}. To apply, run on the server: docker compose up -d",
    "set.listen.local": "this machine only",
    "set.listen.public": "reachable from the network",
    "set.listen.warn": "⚠ The interface is open to the whole network and no password is set — anyone on the network can see your monitoring.",
    "set.pw.current": "Current password",
    "set.pw.new": "New password (6+ characters)",
    "set.pw.save": "Set password",
    "set.pw.off": "Disable password",
    "set.logout": "Sign out",
    "top.logout": "Sign out",
    "set.pw.on.state": "password sign-in is on",
    "set.pw.off.state": "no password — open to everyone on the network",
    "set.pw.saved": "Password updated",
    "set.pw.removed": "Password disabled",
    "set.pw.short": "Password is shorter than 6 characters",
    "set.pw.need": "Enter a new password",
    "set.pw.wrong": "Wrong current password",
    "set.cred.hint": "keys are kept on the server and never sent back",
    "set.cred.url": "OPNsense address",
    "set.cred.tls": "Verify TLS certificate",
    "set.cred.warn": "⚠ The app sends your API key to this address — change it only to your own firewall.",
    "set.cred.checking": "Checking connection…",
    "set.cred.applied": "Connection verified and applied",
    "set.cred.key": "New API key",
    "set.cred.secret": "New API secret",
    "set.cred.save": "Save keys",
    "set.cred.saved": "Keys saved, connection restarted",
    "set.cred.need": "Fill in both key and secret",
    "set.env.key": "API key",
    "set.env.secret": "API secret",
    "set.env.source.env": "from .env",
    "set.env.source.ui": "set via the interface",
    "set.ui": "Interface",
    "set.lang": "Language",
    "set.theme": "Theme",
    "set.theme.system": "System",
    "set.theme.light": "Light",
    "set.theme.dark": "Dark",
    "set.units": "Speed units",
    "set.chart": "Show throughput chart",
    "set.nav": "Collapsed sidebar",
    "set.killconfirm": "Ask for confirmation before dropping a connection",
    "set.timefmt": "Time format",
    "set.timefmt.auto": "Follow interface language",
    "set.timefmt.24": "24-hour (14:30)",
    "set.timefmt.12": "12-hour (2:30 PM)",
    "set.poll": "OPNsense polling",
    "set.poll.hint": "applied immediately, no restart needed",
    "set.ifaces": "Interfaces",
    "set.ifaces.fail": "Could not load the list: ",
    "set.ifaces.none": "none selected",
    "top.ifaces.title": "Monitored interfaces — click to change",
    "top.ifaces.saved": "Interfaces updated",
    "top.ifaces.last": "At least one interface has to stay selected",
    "set.poll_seconds": "Speed poll interval, s",
    "set.states_seconds": "Connections & WireGuard poll interval, s",
    "set.enrich_seconds": "Name refresh interval (ARP/DHCP/DNS), s",
    "set.history": "Chart history points",
    "set.spark": "Sparkline points",
    "set.idle": "Keep an idle host listed for, s",
    "set.connlimit": "Connections limit per host",
    "set.swap": "Swap receive and transmit",
    "set.save": "Save",
    "set.defaults": "Restore values from .env",
    "set.saved": "Saved",
    "set.saved.mem": "Applied, but not written to disk (no /srv/data volume)",
    "set.savefail": "Failed to save: ",
    "set.view": "Table layout",
    "set.reset.cols": "Reset columns and sorting",
    "set.reset.all": "Reset all local settings",
    "set.conn": "Connection",
    "set.env.url": "OPNsense address",
    "set.env.mock": "Mock data mode",
    "set.env.tls": "TLS certificate check",
    "set.env.note": "changed in .env, requires a container restart",
    "yes": "yes",
    "no": "no",
    "nav.wg": "VPN · WireGuard",
    "nav.blocked": "Blocked",
    "blk.title": "Blocked",
    "blk.hint": "Taken from the firewall log rather than the state table: a blocked packet never creates a state. Identical events are folded into groups.",
    "blk.attempt": "Connection attempts",
    "blk.attempt.hint": "something tried to open a connection and was refused",
    "blk.late": "Late packets",
    "blk.late.hint": "the connection's state had already expired",
    "blk.noise": "Broadcast noise",
    "blk.noise.hint": "chatter from neighbouring segments",
    "blk.fold": "Fold noise",
    "blk.search": "Filter: address, port, rule…",
    "blk.empty": "Nothing has been blocked yet",
    "blk.allnoise": "Everything blocked is broadcast noise, which is folded away",
    "blk.col.kind": "Kind",
    "blk.col.rule": "Rule",
    "blk.col.src": "Source",
    "blk.col.srcname": "Source name",
    "blk.col.dst": "Destination",
    "blk.col.service": "Service",
    "blk.col.count": "Times",
    "blk.col.last": "Last seen",
    "blk.kind.attempt": "attempt",
    "blk.kind.late": "late",
    "blk.kind.broadcast": "broadcast",
    "nav.rules": "Rules",
    "rules.title": "Traffic map: from → rule → to",
    "map.group.fw": "Firewall",
    "map.group.own": "OPNsense networks",
    "map.group.wan": "WAN networks",
    "map.ports.none": "no ports (icmp and the like)",
    "map.ports.title": "Destination ports:",
    "map.col.src": "Networks — from",
    "map.col.dnat": "Port forward · DNAT",
    "map.col.snat": "Outbound NAT · SNAT",
    "map.snat.auto": "automatic rule",
    "map.col.rules": "Rules — what passes",
    "map.col.dst": "Networks — to",
    "map.zone.on": "on {n}",
    "map.zone.onMany": "on {n}",
    "map.zone.local": "local network",
    "map.zone.internet": "outside",
    "map.zone.multicast": "multicast",
    "map.zone.ipv6": "IPv6",
    "map.zone.unknown": "unknown",
    "map.legend.nat": "dashed — addresses are translated on this path (NAT)",
    "rules.search.ph": "Filter: rule, address…",
    "rules.empty": "No data yet — waiting for the state poll…",
    "rules.foot": "built from the pf state table · refreshes every 10 s · click a rule for its connections",
    "cfg.title": "Configured rules",
    "cfg.kind.filter": "Filtering",
    "cfg.kind.snat": "Outbound NAT",
    "cfg.hideauto": "Hide automatic rules",
    "cfg.h.action": "Action",
    "cfg.h.nat": "Translate to",
    "cfg.h.iface": "Interface",
    "cfg.h.src": "Source",
    "cfg.h.dst": "Destination",
    "cfg.h.descr": "Description",
    "cfg.h.use": "Now",
    "cfg.active": "{n} conns",
    "cfg.idle": "no traffic",
    "cfg.off": "disabled",
    "cfg.auto": "automatic rule",
    "cfg.empty": "No rules",
    "cfg.nat.wanaddr": "WAN address",
    "cfg.nat.hint": "Address the source is translated to",
    "cfg.noaccess": "No access to rules — grant the user “Firewall: Rules [new]” and “Firewall: NAT: Source NAT”",
    "cfg.error": "Could not load rules: ",
    "rules.nat.out": "masquerade",
    "rules.nat.in": "port forward",
    "rules.help.title": "How to read the packet path",
    "rules.help.1": "Port forwarding (destination NAT) — for inbound traffic the destination address is replaced with an internal one.",
    "rules.help.2": "Filter rules — pass or block; their names are listed below.",
    "rules.help.3": "Outbound NAT (source NAT) — on the way out the source address is replaced with the firewall's own.",
    "rules.help.4": "The diagram reads left to right: source network → rule → destination network. A dashed line means addresses are translated on that path (NAT). Hovering highlights only that node's paths; clicking a rule opens its connections.",
    "rules.help.5": "Networks where OPNsense itself has an address \u2014 interfaces, WireGuard tunnels and the networks named in the configured rules \u2014 are grouped under \u201cOPNsense networks\u201d automatically, while networks on WAN interfaces go into a separate \u201cWAN networks\u201d group. Each subnet is labelled with the interface it runs on, taken from the ARP table and the WireGuard tunnels.",
    "rules.help.6": "Each rule is labelled with the destination ports its connections currently use (hover to see the full list with service names).",
    "rules.help.7": "The diagram follows the packet path: destination NAT (port forward) happens before the rules, source NAT after them. With no translation the link simply skips that column.",
    "rules.help.note": "This shows actual behaviour from the state table: which rules really pass traffic and where addresses get translated. The rule definitions themselves are not exposed by the OPNsense API.",
    "rules.noname": "no description",
    "rules.detail": "Rule",
    "flow.internet": "Internet",
    "flow.other": "other networks",
    "flow.otherRules": "other rules",
    "flow.multicast": "multicast",
    "flow.conns": "conns",
    "nav.collapse": "Collapse",
    "nav.collapse.title": "Collapse menu",
    "nav.expand.title": "Expand menu",
    "top.down": "Download",
    "top.up": "Upload",
    "top.hosts": "Hosts",
    "badge.mock": "mock data",
    "theme.title": "Toggle theme",
    "chart.title": "Throughput",
    "chart.pick": "Show only this line. Click again to bring them all back",
    "chart.hide": "Hide chart",
    "chart.toggle.title": "Show or hide the throughput chart",
    "sys.tiles.hide": "Hide",
    "range.title": "Period to show",
    "range.5m": "5 minutes",
    "range.15m": "15 minutes",
    "range.30m": "30 minutes",
    "range.1h": "1 hour",
    "range.3h": "3 hours",
    "range.6h": "6 hours",
    "range.12h": "12 hours",
    "range.24h": "24 hours",
    "range.2d": "2 days",
    "range.7d": "7 days",
    "range.30d": "30 days",
    "range.empty": "Nothing stored for this period yet — history builds up from first run",
    "err.bad_range": "No such period",
    "tip.peak": "peak",
    "chart.show": "Chart",
    "sys.tiles.show": "Show",
    "hosts.title": "Hosts",
    "cols.btn": "Columns",
    "hosts.speed": "Speed",
    "unit.kbit": "kbit/s — bits per second",
    "unit.kbyte": "KB/s — bytes per second",
    "unit.kbit.short": "kbit/s",
    "unit.kbyte.short": "KB/s",
    "search.ph": "Filter: name, IP, MAC…",
    "col.name": "Host name",
    "col.down": "Receive",
    "col.up": "Transmit",
    "col.conns": "Connections",
    "col.addr": "Address status",
    "col.start": "Start time",
    "col.uptime": "Uptime",
    "col.idle": "Inactivity",
    "col.iface": "Interface",
    "col.vendor": "Vendor",
    "col.peer": "Top peer",
    "col.dests": "Destinations",
    "col.peakdown": "Peak Rx",
    "col.peakup": "Peak Tx",
    "addr.dhcp": "DHCP",
    "addr.static": "static",
    "col.ip": "IPv4 address",
    "col.mac": "MAC address",
    "col.spark": "Activity",
    "col.tdown": "Total Rx [MB]",
    "col.tup": "Total Tx [MB]",
    "hosts.empty": "Nobody in sight yet — waiting for data…",
    "foot.a": "refreshing every",
    "foot.b": "s · click a row for host details",
    "tab.general": "Overview",
    "tab.conns": "Connections",
    "tab.histo": "Histogram",
    "detail.close.title": "Close",
    "detail.resize.title": "Drag to resize; double-click to reset",
    "grip.title": "Drag to resize column; double-click to reset",
    "err.opnsense": "Cannot reach OPNsense API: ",
    "err.backend": "Backend unavailable: ",
    "g.name": "Host name",
    "g.ip": "IP address",
    "g.mac": "MAC address",
    "g.vendor": "Vendor",
    "g.conns": "Active connections",
    "g.iface": "Interface",
    "g.first": "First seen",
    "g.down": "Download now",
    "g.up": "Upload now",
    "g.tdown": "Total downloaded",
    "g.tup": "Total uploaded",
    "g.unknown": "unknown",
    "conn.dir": "Direction",
    "conn.rule": "Traffic rule",
    "conn.proto": "Protocol",
    "conn.natvia": "source is translated to {n} on the way out",
    "conn.service": "Service",
    "conn.src_country": "Source country",
    "conn.src_ip": "Source IP",
    "conn.src_name": "Source name",
    "conn.src_port": "Source port",
    "conn.dst_port": "Destination port",
    "conn.dst_country": "Destination country",
    "conn.dst_ip": "Destination IP",
    "conn.dst_name": "Destination name",
    "conn.gw": "Gateway",
    "conn.rx": "Rx",
    "conn.tx": "Tx",
    "conn.state": "State",
    "conn.age": "Age",
    "conn.out.title": "Connection initiated by this host",
    "conn.in.title": "Incoming connection to this host",
    "conn.local": "Local address",
    "kill.hint": "Click for connection actions",
    "kill.one": "Drop this connection",
    "kill.confirm": "The connection will be reset on the firewall. Continue?",
    "kill.yes": "Yes, drop it (click here)",
    "kill.noid": "This state has no id — cannot drop it",
    "kill.cancel": "Cancel",
    "kill.copy": "Copy addresses",
    "kill.failed": "Failed: ",
    "kill.dropped": "States dropped: {n}",
    "conn.hidefw": "Hide connections with the firewall",
    "conn.hiddenfw": "Firewall connections hidden: {n}",
    "conn.hidelocal": "Hide local connections",
    "conn.hiddenlocal": "Local hidden: {n}",
    "conn.allhidden": "All connections are hidden by the filters — uncheck the boxes above",
    "conn.loading": "Loading…",
    "conn.none": "No active connections",
    "conn.failed": "Failed to load connections: ",
    "conn.limit": "Showing first 300 of {n}",
    "pager.range": "Showing {a}–{b} of {n}",
    "pager.page": "Page {p} / {t}",
    "conn.notunnel": "Cannot determine the peer's tunnel IP (no IPv4 in Allowed IPs)",
    "wg.title": "WireGuard — peers",
    "wg.name": "Name",
    "wg.status": "Status",
    "wg.ips": "Allowed IPs",
    "wg.hs": "Handshake",
    "wg.trx": "Total ↓",
    "wg.ttx": "Total ↑",
    "wg.online": "online",
    "wg.offline": "offline",
    "wg.empty": "No peers or no data yet…",
    "wg.foot": "refreshing every 10 s · “online” — handshake younger than 3 minutes",
    "wg.noaccess": "No access to the WireGuard API — grant the statedash user the “VPN: WireGuard: Status” privilege in OPNsense",
    "wg.err": "WireGuard request failed: ",
    "wgg.allowed": "Allowed IPs",
    "wgg.tunnel": "Tunnel IP",
    "wgg.pub": "Public key",
    "wgg.hs": "Last handshake",
    "wgg.rxnow": "Rx now",
    "wgg.txnow": "Tx now",
    "wgg.trx": "Total received",
    "wgg.ttx": "Total sent",
    "ago.never": "never",
    "ago.now": "just now",
    "ago.sec": "{n}s ago",
    "ago.min": "{n} min ago",
    "ago.hour": "{n}h ago",
  },
};

const UNITS = {
  ru: { bits: ["бит/с", "Кбит/с", "Мбит/с", "Гбит/с"], bytes: ["Б", "КБ", "МБ", "ГБ", "ТБ"] },
  en: { bits: ["bit/s", "kbit/s", "Mbit/s", "Gbit/s"], bytes: ["B", "KB", "MB", "GB", "TB"] },
};

function t(key) {
  const value = I18N[lang][key];
  return value !== undefined ? value : (I18N.ru[key] !== undefined ? I18N.ru[key] : key);
}

function tf(key, n) {
  return t(key).replace("{n}", n);
}

function tp(key, vars) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace("{" + k + "}", v), t(key));
}

function locale() {
  return lang === "en" ? "en-US" : "ru-RU";
}

const columnPickers = [];  // {rebuild} — used to relabel pickers when the language changes

function rebuildColumnPickers() {
  for (const picker of columnPickers) picker.rebuild();
}

function applyStaticLang() {
  document.documentElement.lang = lang;
  document.title = t("app.title");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll("[data-i18n-ph]")) el.placeholder = t(el.dataset.i18nPh);
  const langCurrent = $("#lang-current");
  if (langCurrent) langCurrent.textContent = lang.toUpperCase();
}

const state = {
  pollMs: 2000,
  hosts: [],
  totals: [],
  filter: "",
  sort: { key: "rate", dir: "desc" },  // rate = download + upload (the default)
  tableHover: false,    // while the cursor is over the table rows are not reordered
  rows: new Map(),      // ip -> table row elements
  demo: false,          // public instance: settings on the server are locked
  history: false,       // the long-term store is there and writable
  sparkIps: [],         // hosts on the current page — the only ones needing a sparkline
  sparkCache: new Map(),// ip -> last line seen, so paging back does not blank it
  selectedIp: null,
  selectedWg: null,     // public_key of the selected WireGuard peer
  selectedRule: null,   // key of the selected firewall rule
  detailMode: null,     // "host" | "wg"
  tab: "general",
  connTimer: null,
  detail: null,         // latest /api/host/{ip}/detail response
  deepLinkDone: false,
};

/* ---------- pagination ---------- */

const PAGE_SIZE = 50;        // hosts & blocked
const CONN_PAGE_SIZE = 100;  // connections

const pageState = { hosts: 1, conns: 1, blocked: 1 };
let lastConnTarget = null;

// clamps the current page into [1, ceil(n/size)] and returns the slice bounds
function pageBounds(key, totalItems, size) {
  const total = Math.max(1, Math.ceil(totalItems / size));
  if (pageState[key] > total) pageState[key] = total;
  const start = (pageState[key] - 1) * size;
  return { page: pageState[key], total, start, end: Math.min(start + size, totalItems) };
}

// a prev/next pager with a "X–Y из N" counter; hidden while everything fits on one page
function renderPager(container, key, totalItems, size, onNavigate) {
  const { page, total, start, end } = pageBounds(key, totalItems, size);
  container.replaceChildren();
  container.hidden = totalItems <= size;
  if (container.hidden) return;

  const btn = (label, target, enabled) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pager-btn";
    b.textContent = label;
    b.disabled = !enabled;
    if (enabled) b.addEventListener("click", () => { pageState[key] = target; onNavigate(); });
    return b;
  };
  const range = document.createElement("span");
  range.className = "pager-range";
  range.textContent = tp("pager.range", { a: start + 1, b: end, n: totalItems });
  const pages = document.createElement("span");
  pages.className = "pager-pages";
  pages.textContent = tp("pager.page", { p: page, t: total });

  container.append(btn("‹", page - 1, page > 1), range, pages, btn("›", page + 1, page < total));
}

/* ---------- formatting ---------- */

const NBSP = " ";

function fmtBits(bps) {
  const units = UNITS[lang].bits;
  if (bps < 1000) return [String(Math.round(bps)), units[0]];
  let value = bps;
  let idx = 0;
  while (value >= 1000 && idx < units.length - 1) { value /= 1000; idx++; }
  return [value.toLocaleString(locale(), { maximumFractionDigits: value < 10 ? 1 : 0 }), units[idx]];
}

function fmtBytes(bytes) {
  const units = UNITS[lang].bytes;
  if (!bytes) return "0" + NBSP + units[0];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++; }
  return value.toLocaleString(locale(), { maximumFractionDigits: value < 10 ? 1 : 0 }) + NBSP + units[idx];
}

// time format: "24" — 14:30, "12" — 2:30 PM, auto — whatever the locale says.
// 24-hour is the default rather than auto: timestamps sit next to state ages and
// log-style data, and switching the interface language should not silently
// reformat every clock on the page.
const _storedTimeFormat = localStorage.getItem("statedash-time-format");
let timeFormat = ["24", "12", "auto"].includes(_storedTimeFormat) ? _storedTimeFormat : "24";

function timeOpts(extra = {}) {
  const opts = { ...extra };
  if (timeFormat === "24") opts.hour12 = false;
  else if (timeFormat === "12") opts.hour12 = true;
  return opts;
}

function fmtClock(ts) {
  return new Date(ts * 1000).toLocaleTimeString(locale(), timeOpts());
}

/** An axis label for a chart covering `span` seconds. */
function fmtAxisTime(ts, span) {
  const date = new Date(ts * 1000);
  if (span <= 2 * 86400) {
    return date.toLocaleTimeString(locale(), timeOpts({ hour: "2-digit", minute: "2-digit" }));
  }
  if (span <= 80 * 86400) {
    return date.toLocaleDateString(locale(), { day: "2-digit", month: "2-digit" });
  }
  return date.toLocaleDateString(locale(), { month: "short", year: "2-digit" });
}

function fmtDateTime(ts) {
  return new Date(ts * 1000).toLocaleString(locale(), timeOpts());
}

// fixed units for the table so figures in a column stay comparable at a glance.
// kbit — kilobits per second, kbyte — kilobytes per second
let rateUnit = localStorage.getItem("statedash-rate-unit") === "kbyte" ? "kbyte" : "kbit";

function fmtRate(bps) {
  const value = rateUnit === "kbyte" ? bps / 8 / 1024 : bps / 1000;
  return Math.round(value).toLocaleString(locale()); // whole numbers only — no decimal commas
}

function rateUnitShort() {
  return t(rateUnit === "kbyte" ? "unit.kbyte.short" : "unit.kbit.short");
}

function fmtMB(bytes) {
  return Math.round(bytes / 1048576).toLocaleString(locale());
}

function fmtDuration(seconds) {
  seconds = Math.max(Math.round(seconds), 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function cssVar(name) {
  return getComputedStyle(vizRoot).getPropertyValue(name).trim();
}

/* ---------- chart factory (down/up lines with a crosshair) ---------- */

// Two series unless told otherwise, where a point is [ts, down, up]. The
// throughput chart passes one pair per interface instead, so a point becomes
// [ts, v0, v1, ...] with a descriptor per value.
const DEFAULT_SERIES = [
  { idx: 1, colorVar: "--series-down", labelKey: "top.down", dash: [] },
  { idx: 2, colorVar: "--series-up", labelKey: "top.up", dash: [] },
];

function timeChart(canvas, tip, opts = {}) {
  // Percentages and bit rates cannot share an axis, and the firewall's own
  // readings are percentages. The only differences are the floor the scale will
  // not go below and how a value is spelled, so they are the whole option.
  const percent = opts.unit === "percent";
  // An axis fitted to the data instead of anchored at zero. Only worth it where
  // the interesting movement is small next to the value: a disk that goes from
  // 18.0 to 18.4 per cent over a month is a trend, and on a nought-to-twenty
  // scale it is a straight line four thousandths of the height off the bottom.
  const zoom = !!opts.zoom;
  const geom = { padL: percent ? 44 : 56, padR: 12, padT: 8, padB: 22 };
  const fmtValue = (v) => (percent ? [Math.round(v * 10) / 10, "%"] : fmtBits(v));
  let data = [];   // [[ts, v0, v1, ...], ...]
  let series = DEFAULT_SERIES;
  let peaks = null;  // same shape as data, without the timestamp; stored ranges only
  // The window the chart is meant to be showing, when the caller knows it.
  // Without one the axis is the extent of the data, which is right for the live
  // chart and wrong for a stored range: four cards under one period control
  // each drew their own span, so a device with twenty minutes of history filled
  // the same width as a day of throughput and only the labels said otherwise.
  let frame = null;

  function prep() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height };
  }

  function niceMax(value) {
    if (value <= 0) return 1000;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    for (const mult of [1, 2, 2.5, 5, 10]) {
      if (mult * pow >= value) return mult * pow;
    }
    return 10 * pow;
  }

  function render(hoverIdx = -1) {
    const prepped = prep();
    if (!prepped) return;
    const { ctx, w, h } = prepped;
    const { padL, padR, padT, padB } = geom;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;

    const t0 = frame ? frame.from : data[0][0];
    const t1 = frame ? frame.to : data[data.length - 1][0];
    const span = Math.max(t1 - t0, 1);
    let minVal = 0;
    let maxVal = percent
      ? Math.min(100, niceMax(Math.max(
          ...data.map((d) => Math.max(...series.map((s) => d[s.idx] || 0))), 10)))
      : niceMax(Math.max(
          ...data.map((d) => Math.max(...series.map((s) => d[s.idx] || 0))), 1000));
    if (zoom) {
      const seen = [];
      for (const row of data) {
        for (const s of series) {
          if (row[s.idx] != null) seen.push(row[s.idx]);
        }
      }
      if (seen.length) {
        const lo = Math.min(...seen);
        const hi = Math.max(...seen);
        // room above and below so the line is not drawn along an edge, and a
        // floor under it so a series that never moves still gets a scale
        const pad = Math.max((hi - lo) * 0.2, percent ? 0.2 : 1);
        minVal = Math.max(0, Math.floor((lo - pad) * 10) / 10);
        maxVal = Math.ceil((hi + pad) * 10) / 10;
        if (percent) maxVal = Math.min(100, maxVal);
        if (maxVal <= minVal) maxVal = minVal + 1;
      }
    }
    const range = maxVal - minVal || 1;
    const x = (ts) => padL + ((ts - t0) / span) * plotW;
    const y = (v) => padT + plotH - ((v - minVal) / range) * plotH;

    // grid and Y axis labels — 4 steps
    ctx.strokeStyle = cssVar("--grid");
    ctx.fillStyle = cssVar("--text-muted");
    ctx.lineWidth = 1;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const value = minVal + (range / 4) * i;
      const yy = y(value);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(w - padR, yy);
      ctx.stroke();
      const [fv, fu] = fmtValue(value);
      // keep only the unit prefix on the axis (K/M/G) — the full label does not fit
      const prefix = percent ? fu : fu.replace(/бит\/с|bit\/s/, "");
      // "0" is only the bottom label when the axis actually starts there
      ctx.fillText(i === 0 && !minVal ? "0" : fv + (percent ? prefix : " " + prefix),
                   padL - 8, yy);
    }

    // Time labels, in units the span actually calls for: a clock on a chart
    // covering a year says nothing, and a date on one covering a quarter of an
    // hour says it four times over.
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 3; i++) {
      const ts = t0 + (span / 3) * i;
      ctx.fillText(
        fmtAxisTime(ts, span),
        Math.min(Math.max(x(ts), padL + 14), w - padR - 14),
        padT + plotH + 6
      );
    }

    // baseline
    ctx.strokeStyle = cssVar("--axis");
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(w - padR, padT + plotH);
    ctx.stroke();

    // the haze under a line turns to mud once several overlap, so it is drawn
    // only while the chart holds a single pair
    const fill = series.length <= 2;
    // How far apart the samples normally are, so an actual hole can be told from
    // the ordinary spacing. The median rather than the mean: one long gap must
    // not raise the bar it is measured against.
    const gaps = [];
    for (let i = 1; i < data.length; i++) gaps.push(data[i][0] - data[i - 1][0]);
    gaps.sort((a, b) => a - b);
    const step = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;

    // Everything from here on is cut to the plot rectangle. The store is asked
    // for one bucket more than the window so the line arrives from off-screen
    // instead of starting a bucket-width inside the left edge; without a clip
    // that overhang would be painted across the Y axis labels.
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    for (const s of series) {
      const color = cssVar(s.colorVar);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // A missing value is not a zero and a hole in time is not a straight line
      // across it. Both used to be drawn as measurement: a series absent from
      // the store ran flat along the bottom as though it were idle, and hours
      // with nothing recorded were joined by a steady rate nobody had measured.
      const runs = [];
      let run = null;
      for (let i = 0; i < data.length; i++) {
        const value = data[i][s.idx];
        const broken = run && step && (data[i][0] - run[run.length - 1][0]) > step * 3;
        if (value == null || broken) {
          if (run && run.length) runs.push(run);
          run = value == null ? null : [data[i]];
          continue;
        }
        if (!run) run = [];
        run.push(data[i]);
      }
      if (run && run.length) runs.push(run);

      if (fill) {
        for (const piece of runs) {
          if (piece.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(x(piece[0][0]), padT + plotH);
          for (const d of piece) ctx.lineTo(x(d[0]), y(d[s.idx]));
          ctx.lineTo(x(piece[piece.length - 1][0]), padT + plotH);
          ctx.closePath();
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.beginPath();
      for (const piece of runs) {
        piece.forEach((d, i) => {
          const px = x(d[0]);
          const py = y(d[s.idx]);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
      }
      ctx.setLineDash(s.dash || []);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // With few points, or with one series dwarfed by another sharing the axis,
      // a line pinned to the bottom is indistinguishable from an empty chart —
      // a device doing three kilobits beside one doing a hundred simply looks
      // absent. A mark at each sample says the measurement was taken.
      if (data.length <= 80) {
        ctx.fillStyle = color;
        for (const piece of runs) {
          for (const d of piece) {
            ctx.beginPath();
            ctx.arc(x(d[0]), y(d[s.idx]), 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // crosshair and markers with a surface-coloured ring
    if (hoverIdx >= 0 && hoverIdx < data.length) {
      const point = data[hoverIdx];
      const px = x(point[0]);
      ctx.strokeStyle = cssVar("--axis");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
      for (const s of series) {
        ctx.beginPath();
        ctx.arc(px, y(point[s.idx] || 0), 4, 0, Math.PI * 2);
        ctx.fillStyle = cssVar(s.colorVar);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = cssVar("--surface-1");
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  canvas.addEventListener("mousemove", (event) => {
    if (data.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const plotW = rect.width - geom.padL - geom.padR;
    const rel = (event.clientX - rect.left - geom.padL) / plotW;
    if (rel < 0 || rel > 1) { tip.hidden = true; render(); return; }

    // The sample nearest in time, found with the same scale the line is drawn
    // with. Picking it by position in the array instead assumes the samples are
    // evenly spaced, and they are not: a poll that fails or an interface that
    // drops out of the API answer leaves a gap, and a host's own history stops
    // while it is idle. Where the samples bunch up, the two disagree by a third
    // of the chart's width — the marker sat well away from the pointer.
    const wanted = data[0][0] + rel * Math.max(data[data.length - 1][0] - data[0][0], 1);
    let idx = 0;
    for (let i = 1; i < data.length; i++) {
      if (Math.abs(data[i][0] - wanted) < Math.abs(data[idx][0] - wanted)) idx = i;
    }
    render(idx);
    const point = data[idx];
    // busiest first, so the order in the tooltip matches how the lines are
    // stacked on screen at the point being hovered
    const ranked = [...series].sort((a, b) => (point[b.idx] || 0) - (point[a.idx] || 0));
    const rows = ranked.map((s) => {
      const [value, unit] = fmtValue(point[s.idx] || 0);
      const label = s.label || t(s.labelKey);
      let extra = "";
      const peak = peaks && peaks[idx] ? peaks[idx][s.idx] : null;
      if (peak != null && peak > (point[s.idx] || 0)) {
        const [pv, pu] = fmtValue(peak);
        extra = ` <span class="tip-peak">· ${t("tip.peak")} ${pv} ${pu}</span>`;
      }
      return `<div class="tip-row"><span class="dot" style="background:${cssVar(s.colorVar)}"></span>${label}: ${value} ${unit}${extra}</div>`;
    });
    const t0 = data[0][0];
    const span = Math.max(data[data.length - 1][0] - t0, 1);
    // On a month-long chart a bare clock names one of thirty identical moments,
    // so the date joins it once the span is longer than a day.
    const when = span > 86400 ? fmtDateTime(point[0]) : fmtClock(point[0]);
    tip.innerHTML = `<div class="tip-time">${when}</div>` + rows.join("");
    tip.hidden = false;
    const px = geom.padL + ((point[0] - t0) / span) * plotW;
    const tipX = px + 12 + tip.offsetWidth > rect.width ? px - tip.offsetWidth - 12 : px + 12;
    tip.style.left = tipX + "px";
    tip.style.top = "12px";
  });

  canvas.addEventListener("mouseleave", () => {
    tip.hidden = true;
    render();
  });

  return {
    /** `peaks` is optional and parallel to `data`: the highest value inside each
     *  bucket, which only the stored ranges have. The line stays the average —
     *  drawing both would double every series — and the tooltip carries the peak,
     *  so an hour that averaged calmly still admits to its burst. */
    draw(newData, newSeries, newPeaks, newFrame) {
      data = newData;
      series = newSeries || DEFAULT_SERIES;
      peaks = newPeaks || null;
      frame = newFrame || null;
      render();
    },
    redraw() { render(); },
  };
}

// Each line gets its own colour, assigned from the categorical palette in a
// fixed order so a series keeps its hue as others are filtered out. The dash
// still marks the interface, which groups the pair belonging to one of them and
// doubles as the cue where colour alone is not enough.
const SERIES_COLORS = ["--series-down", "--series-up", "--series-3", "--series-4"];
const IFACE_DASHES = [[], [6, 4], [2, 3], [9, 3, 2, 3], [12, 4]];

// Empty means everything is shown. Clicking a legend entry puts it in here, so
// the first click isolates one line and clicking it again empties the set and
// brings them all back.
let chartPicked = new Set();

function buildThroughputSeries(ifaceTotals) {
  const names = Object.keys(ifaceTotals || {}).sort();
  // with a single interface the plain two-line chart says the same thing
  if (names.length < 2) return null;
  const length = Math.min(...names.map((n) => ifaceTotals[n].length));
  if (length < 2) return null;

  // every series is appended in the same poll, so aligning them from the end
  // lines the timestamps up even when one interface joined later
  const points = [];
  for (let i = 0; i < length; i++) {
    const first = ifaceTotals[names[0]];
    const row = [first[first.length - length + i][0]];
    for (const name of names) {
      const s = ifaceTotals[name];
      const point = s[s.length - length + i];
      row.push(point[1], point[2]);
    }
    points.push(row);
  }

  const series = [];
  names.forEach((name, n) => {
    const dash = IFACE_DASHES[n % IFACE_DASHES.length];
    const label = (ifaceList.find((i) => i.name === name) || {}).label || name;
    for (const [k, dirKey] of [[1, "top.down"], [2, "top.up"]]) {
      const slot = n * 2 + k - 1;
      series.push({
        key: `${name}|${dirKey}`,          // stable across renders, so a pick survives
        idx: n * 2 + k,
        colorVar: SERIES_COLORS[slot % SERIES_COLORS.length],
        label: `${label} ${t(dirKey)}`,
        dash,
      });
    }
  });
  return { points, series };
}

/* ---------- the History section ---------- */
/*
 * "What is happening" and "what happened" are different questions, and mixing
 * them cost three attempts at placing one period control on a page that is
 * otherwise entirely live. They are separate pages now: everything here is read
 * from the store, everything there is read from memory, and the period governs
 * this page alone — which is why it can sit at the top of it and always mean
 * something.
 */

const RANGES = [
  { key: "5m", seconds: 300 },
  { key: "15m", seconds: 900 },
  { key: "30m", seconds: 1800 },
  { key: "1h", seconds: 3600 },
  { key: "3h", seconds: 10800 },
  { key: "6h", seconds: 21600 },
  { key: "12h", seconds: 43200 },
  { key: "24h", seconds: 86400 },
  { key: "2d", seconds: 172800 },
  { key: "7d", seconds: 604800 },
  { key: "30d", seconds: 2592000 },
];
const DEFAULT_RANGE = "24h";

let historyTimer = null;
let histDevice = "";       // "host:1.2.3.4" or "peer:<public key>"

function currentRange() {
  const saved = localStorage.getItem("statedash-range");
  return RANGES.some((r) => r.key === saved) ? saved : DEFAULT_RANGE;
}

function rangeInfo(key) {
  return RANGES.find((r) => r.key === key) || RANGES.find((r) => r.key === DEFAULT_RANGE);
}

// Eleven periods will not fit as a row of buttons, so they live in the same kind
// of menu the interface picker uses.
const rangeMenu = document.createElement("div");
rangeMenu.className = "col-picker range-menu";
rangeMenu.hidden = true;
rangeMenu.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", (event) => {
  if (!rangeMenu.hidden && !rangeMenu.contains(event.target)) rangeMenu.hidden = true;
});

function buildRangePicker() {
  const box = $("#hist-range");
  if (!box) return;
  if (!rangeMenu.parentNode) vizRoot.appendChild(rangeMenu);
  box.replaceChildren(
    Object.assign(document.createElement("span"), { textContent: t("range." + currentRange()) }),
    Object.assign(document.createElement("span"), { className: "caret", textContent: "▾" }),
  );
  box.onclick = (event) => {
    event.stopPropagation();
    if (!rangeMenu.hidden) { rangeMenu.hidden = true; return; }
    rangeMenu.replaceChildren(...RANGES.map((r) => {
      const item = Object.assign(document.createElement("button"), {
        className: "range-item" + (r.key === currentRange() ? " active" : ""),
        type: "button",
        textContent: t("range." + r.key),
      });
      item.addEventListener("click", () => { rangeMenu.hidden = true; setRange(r.key); });
      return item;
    }));
    const rect = box.getBoundingClientRect();
    rangeMenu.style.top = rect.bottom + 6 + "px";
    rangeMenu.style.left = Math.max(Math.min(rect.left, window.innerWidth - 150), 8) + "px";
    rangeMenu.style.minWidth = Math.max(rect.width, 120) + "px";
    rangeMenu.hidden = false;
  };
}

function setRange(range) {
  localStorage.setItem("statedash-range", range);
  buildRangePicker();
  loadHistoryView();
}

/** The section is only there when there is something behind it. */
function applyHistoryNav() {
  const item = $("#nav-history");
  if (item) item.hidden = !state.history;
  // a period chosen before the store went away would leave this page blank
  // `state.view` never existed — this read was the only mention of it in the
  // file, so the escape never fired and the page stayed frozen with its menu
  // entry gone. The DOM knows which view is open.
  if (!state.history && historyOpen()) switchView("hosts");
}

// The History section's charts were in no redraw hook at all: switching theme
// left them in the old palette, and widening the window left a small bitmap
// stretched across a wide card.
function redrawHistoryCharts() {
  for (const chart of [histNetChart, histSysChart, histDiskChart, histDeviceChart]) {
    if (chart) chart.redraw();
  }
}

function historyOpen() {
  return !$("#view-history").hidden;
}

let historyLoading = false;
// The period a round is drawing, held for as long as the round lasts. Every
// fetch in it asks for this rather than for whatever is chosen at the moment it
// happens to run: the first answer is awaited before the other four are asked
// for, so a period changed inside that gap used to send the second half of the
// round to a different window. Firewall and Disk would be showing a week while
// the picker and the other two charts said five minutes, on one page, with
// nothing to reveal it but the axis labels.
let historyRound = "";
// A round that arrives while one is running is remembered rather than dropped.
// Dropping it left the page on the old period until the minute timer came
// round, which is the same wrong picture, only for longer.
let historyAgain = false;

/**
 * Everything on the page, for the period now chosen.
 *
 * The timer is created once and never inside the loader. Clearing it at the top
 * and setting it again at the bottom looks equivalent, but the middle is
 * awaited: two overlapping runs each created an interval and only the last id
 * was remembered, so changing the period a few times left several alive at
 * once, each spawning more. The `historyLoading` flag drops a tick that arrives
 * while the previous one is still fetching.
 */
async function loadHistoryView() {
  if (!historyOpen() || !state.history) return;
  if (historyLoading) { historyAgain = true; return; }
  historyLoading = true;
  try {
    do {
      historyAgain = false;
      historyRound = currentRange();
      await loadDeviceList();
      // one answer serves both firewall charts; they used to fetch it separately
      const system = await fetchRange("kind=system");
      await Promise.all([loadNetHistory(), loadSystemHistory(system),
                         loadDiskHistory(system), loadDeviceHistory()]);
      // a period chosen while the round was in flight gets its own round, so
      // what is on screen at the end is what the picker says
    } while (historyAgain && historyOpen() && currentRange() !== historyRound);
  } finally {
    historyRound = "";
    historyLoading = false;
  }
  // a minute is the finest the store keeps, so asking oftener returns the same
  if (!historyTimer) {
    historyTimer = setInterval(() => { if (historyOpen()) loadHistoryView(); }, 60000);
  }
}

async function fetchRange(query) {
  try {
    const range = historyRound || currentRange();
    const res = await fetch(`/api/history?range=${encodeURIComponent(range)}&${query}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Merge the store's per-series arrays onto one time axis.
 *
 * Returns the matrix the chart wants plus a parallel one of peaks: the line is
 * the average over each bucket and the tooltip names the highest value inside
 * it, because an hour of averages hides the burst that made the hour worth
 * looking at.
 */
function mergeSeries(data, use) {
  const times = new Set();
  for (const [key] of use) for (const point of data.series[key] || []) times.add(point[0]);
  const axis = [...times].sort((a, b) => a - b);
  const at = new Map(axis.map((ts, i) => [ts, i]));
  const points = axis.map((ts) => [ts]);
  const peaks = axis.map(() => []);
  use.forEach(([key], slot) => {
    for (const point of data.series[key] || []) {
      const i = at.get(point[0]);
      points[i][slot + 1] = point[1];
      peaks[i][slot + 1] = point[2];
    }
  });
  return { points, peaks };
}

function legendInto(box, series) {
  if (!box) return;
  box.replaceChildren(...series.map((s) => {
    const item = Object.assign(document.createElement("span"), { className: "legend-item" });
    const key = Object.assign(document.createElement("span"), { className: "key" });
    key.style.background = cssVar(s.colorVar);
    item.append(key, document.createTextNode(s.label));
    return item;
  }));
}

/**
 * Fold a long series down to about one point every two pixels.
 *
 * A month of hourly points across a thousand pixels draws as a block rather than
 * a line. Averaging the group keeps the shape; the highest peak in the group is
 * carried through rather than averaged, so the tooltip still admits what the
 * smoothing took out.
 */
function foldToWidth(canvas, points, peaks) {
  const width = Math.max(200, (canvas ? canvas.getBoundingClientRect().width : 900) - 68);
  const target = Math.max(60, Math.floor(width / 2));
  if (points.length <= target * 1.5) return [points, peaks];
  const size = Math.ceil(points.length / target);
  const outPoints = [];
  const outPeaks = [];
  for (let start = 0; start < points.length; start += size) {
    const group = points.slice(start, start + size);
    const groupPeaks = peaks.slice(start, start + size);
    const row = [group[Math.floor(group.length / 2)][0]];
    const peakRow = [];
    for (let col = 1; col < group[0].length; col++) {
      let sum = 0, seen = 0, high = 0;
      for (let i = 0; i < group.length; i++) {
        const value = group[i][col];
        if (value == null) continue;
        sum += value;
        seen++;
        const peak = groupPeaks[i] ? groupPeaks[i][col] : 0;
        if (peak > high) high = peak;
      }
      row[col] = seen ? sum / seen : undefined;
      peakRow[col] = high;
    }
    outPoints.push(row);
    outPeaks.push(peakRow);
  }
  return [outPoints, outPeaks];
}

/* ---- how much is actually there ---- */

// A card with one point in it draws nothing — a line needs two — so for the
// first minute of a new install all four charts were blank canvases with no
// word of explanation, which reads as a fault rather than as a store that has
// only just started. The note is what says so, and it belongs to whether
// anything is drawable, not to whether a series exists.
function drawable(data) {
  return !!data && !!data.series
    && Object.values(data.series).some((points) => points.length >= 2);
}

/* ---- throughput ---- */

async function loadNetHistory() {
  const data = await fetchRange("kind=throughput");
  if (!data || !data.available) return;
  const keys = Object.keys(data.series);
  const note = $("#hist-net-empty");
  if (note) note.hidden = drawable(data);
  if (!drawable(data)) {
    histNetChart.draw([], DEFAULT_SERIES);
    legendInto($("#hist-net-legend"), []);
    return;
  }
  const ifaces = [...new Set(keys.filter((k) => k.startsWith("iface|")).map((k) => k.split("|")[1]))].sort();
  const use = ifaces.length >= 2
    ? ifaces.flatMap((name) => [[`iface|${name}|down`, name, "top.down"], [`iface|${name}|up`, name, "top.up"]])
    : [["net|down", "", "top.down"], ["net|up", "", "top.up"]];
  const { points, peaks } = mergeSeries(data, use);
  const series = use.map(([, name, dirKey], slot) => {
    const label = (ifaceList.find((i) => i.name === name) || {}).label || name;
    return {
      key: `${name}|${dirKey}`,
      idx: slot + 1,
      colorVar: SERIES_COLORS[slot % SERIES_COLORS.length],
      label: name ? `${label} ${t(dirKey)}` : t(dirKey),
      dash: IFACE_DASHES[Math.floor(slot / 2) % IFACE_DASHES.length],
    };
  });
  const [drawn, drawnPeaks] = foldToWidth($("#hist-net"), points, peaks);
  histNetChart.draw(drawn, series, drawnPeaks, { from: data.from, to: data.to });
  legendInto($("#hist-net-legend"), series);
}

/* ---- the firewall's own readings ---- */

// Percentages only: temperature is degrees and would need its own scale, and a
// tile is enough for it.
const SYS_HISTORY = [
  ["sys|cpu", "sys.cpu"], ["sys|memory", "sys.memory"], ["sys|swap", "sys.swap"],
  ["sys|mbuf", "sys.mbuf"], ["sys|states", "sys.states"],
];
// Six readings need six colours; the throughput chart's four cycle, and two
// identical squares in a legend say nothing.
const SYS_COLORS = ["--series-down", "--series-up", "--series-3",
                    "--series-4", "--flow-7", "--flow-5"];

async function loadSystemHistory(data) {
  const card = $("#hist-sys-card");
  if (!data || !data.available) return;
  const use = SYS_HISTORY.filter(([key]) => (data.series[key] || []).length);
  if (card) card.hidden = !use.length;
  if (!use.length) return;
  const note = $("#hist-sys-empty");
  const enough = use.some(([key]) => (data.series[key] || []).length >= 2);
  if (note) note.hidden = enough;
  if (!enough) {
    histSysChart.draw([], []);
    legendInto($("#hist-sys-legend"), []);
    return;
  }
  const { points, peaks } = mergeSeries(data, use);
  const series = use.map(([key, labelKey], slot) => ({
    key,
    idx: slot + 1,
    colorVar: SYS_COLORS[slot % SYS_COLORS.length],
    label: t(labelKey),
  }));
  const [drawn, drawnPeaks] = foldToWidth($("#hist-sys"), points, peaks);
  histSysChart.draw(drawn, series, drawnPeaks, { from: data.from, to: data.to });
  legendInto($("#hist-sys-legend"), series);
}

/* ---- the disk, on its own ---- */

/**
 * Filling a disk is measured in per cent a month, so beside a processor that
 * swings by forty in a minute it is a flat line crossing everything else. Its
 * own chart gives it an axis fitted to its own range, where a month of filling
 * up is the one thing on this page worth reading as a trend.
 */
async function loadDiskHistory(data) {
  const card = $("#hist-disk-card");
  if (!data || !data.available) return;
  const rows = data.series["sys|disk"] || [];
  if (card) card.hidden = !rows.length;
  if (!rows.length) return;
  const note = $("#hist-disk-empty");
  if (note) note.hidden = rows.length >= 2;
  if (rows.length < 2) {
    histDiskChart.draw([], []);
    legendInto($("#hist-disk-legend"), []);
    return;
  }
  const { points, peaks } = mergeSeries(data, [["sys|disk"]]);
  const series = [{ key: "sys|disk", idx: 1, colorVar: "--flow-5", label: t("sys.disk") }];
  const [drawn, drawnPeaks] = foldToWidth($("#hist-disk"), points, peaks);
  histDiskChart.draw(drawn, series, drawnPeaks, { from: data.from, to: data.to });
  legendInto($("#hist-disk-legend"), series);
}

/* ---- one device ---- */

// What the store actually holds figures for, rather than everything on the
// network: a device first seen a minute ago has nothing to show, and an empty
// chart reads as a fault rather than an answer.
let histDevices = [];

async function loadDeviceList() {
  try {
    const res = await fetch("/api/history/devices");
    if (!res.ok) return;
    histDevices = (await res.json()).devices || [];
  } catch { /* keep the previous list */ }
  buildDevicePicker();
}

// A plain list of every device on the network is fine at a dozen and unusable at
// two hundred: no way to search, and the one you want is somewhere in the middle
// of an alphabet. This is the same menu the interfaces and periods use, with a
// filter at the top — the field matches the one above the hosts table, so
// searching means the same thing in both places.
const deviceMenu = document.createElement("div");
deviceMenu.className = "col-picker device-menu";
deviceMenu.hidden = true;
deviceMenu.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", (event) => {
  if (!deviceMenu.hidden && !deviceMenu.contains(event.target)) deviceMenu.hidden = true;
});

function deviceLabel(key) {
  const found = histDevices.find((d) => d.key === key);
  return found ? found.label : "";
}

function buildDevicePicker() {
  const button = $("#hist-device");
  if (!button) return;
  if (!deviceMenu.parentNode) vizRoot.appendChild(deviceMenu);
  if (!histDevices.some((d) => d.key === histDevice)) {
    histDevice = histDevices.length ? histDevices[0].key : "";
  }
  button.hidden = !histDevices.length;
  button.replaceChildren(
    Object.assign(document.createElement("span"), { textContent: deviceLabel(histDevice) }),
    Object.assign(document.createElement("span"), { className: "caret", textContent: "▾" }),
  );
  button.onclick = (event) => {
    event.stopPropagation();
    if (!deviceMenu.hidden) { deviceMenu.hidden = true; return; }
    openDeviceMenu(button);
  };
}

function openDeviceMenu(button) {
  const search = Object.assign(document.createElement("input"), {
    className: "search device-search", type: "search", placeholder: t("hist.device.search"),
  });
  const list = Object.assign(document.createElement("div"), { className: "device-list" });

  const render = () => {
    const needle = search.value.trim().toLowerCase();
    // the address is worth matching as well as the name: a device with no name
    // is only findable by it
    const shown = histDevices.filter((d) => !needle
      || d.label.toLowerCase().includes(needle)
      || d.key.toLowerCase().includes(needle));
    // Five weeks of history holds every address the firewall has seen, most of
    // them the far end of one connection. Saying which group a run belongs to is
    // what makes the difference between a list and a heap.
    const groupOf = (d) => (d.kind === "peer" ? "vpn" : d.live ? "live" : "past");
    let group = "";
    const rows = [];
    for (const d of shown) {
      const g = groupOf(d);
      if (g !== group) {
        group = g;
        rows.push(Object.assign(document.createElement("div"),
          { className: "device-group", textContent: t("hist.device." + g) }));
      }
      const item = Object.assign(document.createElement("button"), {
        className: "range-item" + (d.key === histDevice ? " active" : ""),
        type: "button",
        textContent: d.label,
      });
      item.addEventListener("click", () => {
        deviceMenu.hidden = true;
        histDevice = d.key;
        buildDevicePicker();
        loadDeviceHistory();
      });
      rows.push(item);
    }
    list.replaceChildren(...rows);
    if (!shown.length) {
      list.append(Object.assign(document.createElement("div"),
        { className: "device-none", textContent: t("hist.device.nomatch") }));
    }
    return shown;
  };

  search.addEventListener("input", render);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { deviceMenu.hidden = true; return; }
    // Enter takes the only thing left, which is what typing an address is for
    if (event.key === "Enter") {
      const first = list.querySelector("button");
      if (first) first.click();
    }
  });

  deviceMenu.replaceChildren(search, list);
  render();
  // Placed against the room there actually is: the picker sits well down the
  // page, and a menu of several hundred devices opened downwards ran off the
  // bottom of the window with no way to reach the end of it.
  const rect = button.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - 12;
  const above = rect.top - 12;
  // Down when there is room for a useful number of rows, up when there is not:
  // eight visible entries out of several hundred is a peephole, and the space
  // above the picker is usually the larger of the two.
  const up = below < 320 && above > below;
  deviceMenu.style.maxHeight = Math.min(up ? above : below, window.innerHeight * 0.6) + "px";
  deviceMenu.style.left = Math.max(Math.min(rect.left, window.innerWidth - 280), 8) + "px";
  deviceMenu.style.minWidth = Math.max(rect.width, 260) + "px";
  deviceMenu.hidden = false;
  deviceMenu.style.top = up
    ? Math.max(rect.top - 6 - deviceMenu.offsetHeight, 8) + "px"
    : rect.bottom + 6 + "px";
  search.focus();
}

async function loadDeviceHistory() {
  buildDevicePicker();
  const note = $("#hist-device-empty");
  if (!histDevice) {
    if (note) note.hidden = false;
    histDeviceChart.draw([], DEFAULT_SERIES);
    return;
  }
  const [kind, id] = [histDevice.slice(0, histDevice.indexOf(":")), histDevice.slice(histDevice.indexOf(":") + 1)];
  const query = kind === "peer"
    ? `kind=peer&key=${encodeURIComponent(id)}`
    : `kind=host&ip=${encodeURIComponent(id)}`;
  const names = kind === "peer"
    ? [`peer|${id}|down`, `peer|${id}|up`]
    : [`${id}|down`, `${id}|up`];
  const data = await fetchRange(query);
  if (!data || !data.available) return;
  const use = [[names[0]], [names[1]]];
  const { points, peaks } = mergeSeries(data, use);
  // one point is a device the store has only just met, and one point draws no
  // line: the note has to speak for it as well as for none at all
  if (note) note.hidden = points.length >= 2;
  const [drawn, drawnPeaks] = foldToWidth($("#hist-device-chart"), points, peaks);
  histDeviceChart.draw(drawn, DEFAULT_SERIES, drawnPeaks, { from: data.from, to: data.to });
  legendInto($("#hist-device-legend"), DEFAULT_SERIES.map((s) => ({ ...s, label: t(s.labelKey) })));

  // Both directions share one scale, and on most devices they differ by one or
  // two orders of magnitude: the smaller line lies along the axis and reads as
  // an empty chart. The figures say what the flat line cannot — that the device
  // did three kilobits, not nothing.
  const figures = $("#hist-device-figures");
  if (figures) {
    const parts = [];
    for (const [rows, key] of [[data.series[names[0]] || [], "top.down"],
                               [data.series[names[1]] || [], "top.up"]]) {
      if (!rows.length) continue;
      const avg = rows.reduce((sum, r) => sum + r[1], 0) / rows.length;
      const peak = Math.max(...rows.map((r) => r[2]));
      const [av, au] = fmtBits(avg);
      const [pv, pu] = fmtBits(peak);
      parts.push(`${t(key)} ${av} ${au} · ${t("tip.peak")} ${pv} ${pu}`);
    }
    figures.textContent = parts.join("   ");
  }
}


function renderChartLegend(series, pickable = false) {
  const box = $("#chart-legend");
  if (!box) return;
  box.replaceChildren(...series.map((s) => {
    const item = document.createElement(pickable ? "button" : "span");
    item.className = "legend-item";
    if (pickable) {
      item.type = "button";
      item.title = t("chart.pick");
      // with nothing picked every line is shown, so nothing is dimmed
      if (chartPicked.size && !chartPicked.has(s.key)) item.classList.add("legend-off");
      item.addEventListener("click", () => {
        if (chartPicked.has(s.key)) chartPicked.delete(s.key); else chartPicked.add(s.key);
        render();
      });
    }
    const key = document.createElement("span");
    key.className = "key";
    key.style.background = cssVar(s.colorVar);
    // a dashed key mirrors the dashed line, so the two can be matched up
    if (s.dash && s.dash.length) key.classList.add("key-dashed");
    const text = document.createElement("span");
    text.textContent = s.label || t(s.labelKey);
    item.append(key, text);
    return item;
  }));
}

const mainChart = timeChart($("#main-chart"), $("#chart-tip"));
const histoChart = timeChart($("#histo-chart"), $("#histo-tip"));
// the firewall's own readings are percentages, so they get their own axis
// the History section: traffic and one device in bits, the firewall in per cent
const histNetChart = timeChart($("#hist-net"), $("#hist-net-tip"));
const histSysChart = timeChart($("#hist-sys"), $("#hist-sys-tip"), { unit: "percent" });
const histDiskChart = timeChart($("#hist-disk"), $("#hist-disk-tip"),
                                { unit: "percent", zoom: true });
const histDeviceChart = timeChart($("#hist-device-chart"), $("#hist-device-tip"));

/* ---------- backend polling ---------- */

// The next poll is always scheduled through here, so asking for one early —
// after a page change brings different hosts on screen — replaces the pending
// timer instead of starting a second chain of them.
let pollTimer = null;
function schedulePoll(ms) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(poll, ms);
}

async function poll() {
  try {
    // Only the rows on screen can show a sparkline, and the line is most of a
    // host's weight, so the backend is told which ones to send.
    const res = await fetch("/api/hosts?spark=" + encodeURIComponent(state.sparkIps.join(",")));
    if (res.status === 401) { location.href = "/login"; return; }  // session expired
    const data = await res.json();
    state.pollMs = Math.max((data.poll_seconds || 2) * 1000, 1000);
    state.hosts = data.hosts || [];
    // A host that scrolled off the page keeps its last known line until it is
    // asked for again, so switching pages back and forth does not blink.
    const cache = new Map();
    for (const host of state.hosts) {
      if (!host.spark || !host.spark.length) host.spark = state.sparkCache.get(host.ip) || [];
      if (host.spark.length) cache.set(host.ip, host.spark);
    }
    state.sparkCache = cache;  // hosts that are gone drop out with it
    state.totals = data.totals || [];
    state.ifaceTotals = data.iface_totals || {};
    state.firewallIps = new Set(data.firewall_ips || []);
    $("#poll-int").textContent = String(data.poll_seconds || 2);
    $("#mock-badge").hidden = !data.mock;
    if (data.demo && !state.demo) { state.demo = true; applyDemoMode(); }
    if (Boolean(data.history) !== state.history) {
      state.history = Boolean(data.history);
      applyHistoryNav();
      if (state.history && currentRange() !== "live") setRange(currentRange());
    }
    const ver = $("#side-version");
    if (ver && data.version && ver.textContent !== data.version) {
      ver.textContent = data.version;
    }
    if (!ifaceList.length && data.ifaces) {   // before the list loads, show the value from the snapshot
      const label = $("#iface-badge").firstChild;
      if (label) label.textContent = data.ifaces;
    }
    const banner = $("#error-banner");
    if (data.error) {
      banner.textContent = t("err.opnsense") + data.error;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
    render();
    if (!state.deepLinkDone && state.hosts.length) {
      state.deepLinkDone = true;
      const wantHost = urlParams.get("host");
      if (wantHost && state.hosts.some((h) => h.ip === wantHost)) {
        const wantTab = urlParams.get("tab");
        if (["general", "conns", "histo"].includes(wantTab)) state.tab = wantTab;
        selectHost(wantHost);
      }
    }
  } catch (err) {
    const banner = $("#error-banner");
    banner.textContent = t("err.backend") + err.message;
    banner.hidden = false;
  } finally {
    schedulePoll(state.pollMs);
  }
}

/* ---------- header and hosts table ---------- */

function render() {
  const last = state.totals[state.totals.length - 1];
  const [dv, du] = fmtBits(last ? last[1] : 0);
  const [uv, uu] = fmtBits(last ? last[2] : 0);
  $("#tile-down").textContent = `${dv} ${du}`;
  $("#tile-up").textContent = `${uv} ${uu}`;
  $("#tile-hosts").textContent = String(state.hosts.filter((h) => h.active).length);

  const built = buildThroughputSeries(state.ifaceTotals);
  if (built) {
    // a pick naming series that no longer exist would blank the chart, so it is
    // dropped when the watched interfaces change
    const keys = new Set(built.series.map((s) => s.key));
    for (const key of chartPicked) if (!keys.has(key)) chartPicked.delete(key);

    const shown = chartPicked.size
      ? built.series.filter((s) => chartPicked.has(s.key))
      : built.series;
    mainChart.draw(built.points, shown);
    renderChartLegend(built.series, true);
  } else {
    chartPicked.clear();
    mainChart.draw(state.totals);
    renderChartLegend(DEFAULT_SERIES);
  }
  renderTable();

  if (state.selectedIp) {
    if (!state.hosts.some((h) => h.ip === state.selectedIp)) {
      closeDetail();
    } else {
      refreshDetail();
    }
  }
}

function hostMatches(host) {
  if (!state.filter) return true;
  const needle = state.filter.toLowerCase();
  return (host.name + " " + host.ip + " " + host.mac).toLowerCase().includes(needle);
}

function ipSortKey(ip) {
  if (ip.includes(":")) return ip; // IPv6 — compare as a string
  return ip.split(".").map((n) => n.padStart(3, "0")).join(".");
}

function sortValue(host, key) {
  switch (key) {
    // with no name the column shows the IP — sort by it so the order matches what is visible
    case "name": return host.name ? host.name.toLowerCase() : ipSortKey(host.ip);
    case "ip": return ipSortKey(host.ip);
    case "mac": return host.mac || "";
    case "down": return host.down;
    case "up": return host.up;
    case "conns": return host.conns || 0;
    case "addr": return host.dhcp ? 0 : 1;
    case "start": return host.first_seen || 0;
    case "uptime": return -(host.first_seen || 0);   // longer online — larger
    case "idle": return -(host.last_seen || 0);      // silent longer — larger
    case "iface": return host.iface || "";
    case "vendor": return (host.vendor || "").toLowerCase();
    case "peer": return (host.top_peer_name || host.top_peer_ip || "").toLowerCase();
    case "dests": return host.dests || 0;
    case "peakdown": return host.peak_down || 0;
    case "peakup": return host.peak_up || 0;
    case "total_down": return host.total_down;
    case "total_up": return host.total_up;
    default: return host.down + host.up;
  }
}

function compareHosts(a, b) {
  const { key, dir } = state.sort;
  const va = sortValue(a, key);
  const vb = sortValue(b, key);
  if (typeof va === "string") {
    // hosts without a value always go last, whatever the direction
    if (!va && vb) return 1;
    if (va && !vb) return -1;
    const cmp = va.localeCompare(vb, "ru");
    return dir === "asc" ? cmp : -cmp;
  }
  const cmp = va - vb;
  return dir === "asc" ? cmp : -cmp;
}

function updateSortIndicators() {
  for (const th of document.querySelectorAll("#hosts-table th.sortable")) {
    const active = th.dataset.sort === state.sort.key;
    th.classList.toggle("sorted", active);
    if (active) th.dataset.dir = state.sort.dir; else delete th.dataset.dir;
  }
}

/* ---------- the firewall's own health ---------- */

let systemTimer = null;
// kept so the tiles can be repainted when the theme changes: their bar colours
// are mixed from the theme's own variables, and a stale colour would sit there
// until the next poll
let lastSystem = null;

// One decimal below ten, none above: a tile showing "22.1%" spends a character
// on noise, while "0.2%" of the state table is the whole of what it has to say.
// Localised, so it does not sit next to a comma-separated temperature with a
// full stop of its own.
function fmtPct(value) {
  const digits = Math.abs(value) < 10 ? 1 : 0;
  return value.toLocaleString(locale(), { minimumFractionDigits: 0, maximumFractionDigits: digits }) + "%";
}

// df -h talks in "3.2G" and "256M". Those are the only sizes the disk answer
// carries — there is no byte count behind them — so they are read back into
// bytes and printed like every other size on the page.
const DF_UNITS = { K: 1024, M: 1048576, G: 1073741824, T: 1099511627776, P: 1125899906842624 };

function fmtDf(value) {
  const match = /^([\d.]+)\s*([KMGTP])?/i.exec(String(value || "").trim());
  if (!match) return String(value || "");
  const size = parseFloat(match[1]) * (DF_UNITS[(match[2] || "").toUpperCase()] || 1);
  return Number.isFinite(size) ? fmtBytes(size) : String(value);
}


// Where a reading stops being unremarkable. Two steps rather than one: a tile
// that only ever turns red says nothing until it is too late.
const SYS_LEVELS = {
  cpu: [80, 95], memory: [85, 95], swap: [25, 60],
  mbuf: [70, 90], states: [70, 90], disk: [85, 95],
};

function sysLevel(key, pct) {
  const [warn, bad] = SYS_LEVELS[key] || [80, 95];
  if (pct >= bad) return "bad";
  if (pct >= warn) return "warn";
  return "ok";
}

/**
 * The bar's colour, walked from calm to critical as the figure rises.
 *
 * Three anchors rather than a rainbow, and they are the status colours the rest
 * of the interface already uses: green, then yellow at the metric's warning
 * mark, then red at its limit. Mixing between them rather than stepping means a
 * meter at two thirds looks different from one at a third, which is the point —
 * stepping only at the thresholds leaves everything below the first one looking
 * identically fine. No new hue is introduced, so nothing here can be mistaken
 * for the blue and orange the traffic chart above spends on interfaces.
 */
function mixHex(from, to, k) {
  const parse = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [a, b] = [parse(from), parse(to)];
  const mixed = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(k, 1))));
  return `rgb(${mixed.join(", ")})`;
}

function sysColor(key, pct) {
  const [warn, bad] = SYS_LEVELS[key] || [80, 95];
  const calm = cssVar("--series-3");     // green
  const caution = cssVar("--series-4");  // yellow
  const alarm = cssVar("--critical");    // red
  if (pct <= 0) return calm;
  if (pct >= bad) return alarm;
  return pct < warn
    ? mixHex(calm, caution, pct / warn)
    : mixHex(caution, alarm, (pct - warn) / (bad - warn));
}

async function loadSystem() {
  try {
    const res = await fetch("/api/system");
    if (!res.ok) return;
    const data = await res.json();
    const card = $("#sys-card");
    const moved = card.hidden !== !data.available;
    card.hidden = !data.available;
    // The card arrives a moment after the page does; the chart belongs in it
    // once it is here, and in a card of its own while it is not.
    if (moved) applyCharts();
    if (data.available) {
      lastSystem = data.metrics || {};
      renderSystem(lastSystem);
    }
  } catch (err) {
    // a reading that did not arrive leaves the tiles as they were; the traffic
    // side of the page is the part worth interrupting for
  }
}

function renderSystem(m) {
  const tiles = [];

  if (m.cpu) {
    tiles.push({
      key: "cpu", label: t("sys.cpu"), value: fmtPct(m.cpu.total), pct: m.cpu.total,
      sub: tp("sys.cpu.sub", { u: m.cpu.user, s: m.cpu.sys }),
    });
  }
  if (m.memory) {
    tiles.push({
      key: "memory", label: t("sys.memory"), value: fmtPct(m.memory.pct), pct: m.memory.pct,
      sub: `${fmtBytes(m.memory.used)} / ${fmtBytes(m.memory.total)}`,
    });
  }
  if (m.swap) {
    tiles.push({
      key: "swap", label: t("sys.swap"), value: fmtPct(m.swap.pct), pct: m.swap.pct,
      sub: `${fmtBytes(m.swap.used)} / ${fmtBytes(m.swap.total)}`,
    });
  }
  if (m.temperature) {
    // no meter: there is no maximum to measure a temperature against, so the
    // figure stands on its own and the level comes from absolute degrees
    const deg = m.temperature.value;
    tiles.push({
      key: "temp", label: t("sys.temp"),
      value: deg.toLocaleString(locale(), { maximumFractionDigits: 1 }) + "\u00a0°C",
      level: deg >= 90 ? "bad" : deg >= 75 ? "warn" : "ok",
      sub: m.temperature.device,
    });
  }
  if (m.mbuf) {
    tiles.push({
      key: "mbuf", label: t("sys.mbuf"), value: fmtPct(m.mbuf.pct), pct: m.mbuf.pct,
      sub: `${fmtCount(m.mbuf.used)} / ${fmtCount(m.mbuf.max)}`,
      // Failures are the reading that matters here: anything but zero means a
      // packet was dropped for want of a buffer, however low the percentage.
      level: m.mbuf.failures ? "bad" : undefined,
      note: m.mbuf.failures ? tf("sys.failures", fmtCount(m.mbuf.failures)) : "",
    });
  }
  if (m.states) {
    tiles.push({
      key: "states", label: t("sys.states"), value: fmtPct(m.states.pct), pct: m.states.pct,
      sub: `${fmtCount(m.states.current)} / ${fmtCount(m.states.limit)}`,
    });
  }
  if (m.disk) {
    tiles.push({
      key: "disk", label: t("sys.disk"), value: fmtPct(m.disk.pct), pct: m.disk.pct,
      sub: `${fmtDf(m.disk.used)} / ${fmtDf(m.disk.total)} · ${m.disk.mountpoint}`,
    });
  }

  const holder = $("#sys-tiles");
  holder.replaceChildren();
  for (const tile of tiles) {
    const level = tile.level || sysLevel(tile.key, tile.pct || 0);
    // The colour never carries the state on its own: a tile that is not
    // ordinary says so in words underneath, which survives a monochrome screen
    // and a reader who cannot tell the two hues apart.
    const note = tile.note || (level === "bad" ? t("sys.over") : level === "warn" ? t("sys.near") : "");
    const el = document.createElement("div");
    el.className = "sys-tile";
    el.dataset.level = level;
    el.innerHTML = `
      <div class="sys-label"></div>
      <div class="sys-value"></div>
      ${tile.pct === undefined
        ? '<div class="sys-spacer"></div>'   // no scale to measure a temperature against
        : '<div class="sys-meter"><i></i></div>'}
      <div class="sys-sub"></div>`;
    el.querySelector(".sys-label").textContent = tile.label;
    el.querySelector(".sys-value").textContent = tile.value;
    const meter = el.querySelector(".sys-meter i");
    if (meter) {
      meter.style.width = Math.max(0, Math.min(tile.pct, 100)) + "%";
      // failures put the tile at the limit whatever its percentage says, so the
      // bar takes the level's colour rather than the figure's
      meter.style.background = level === "bad" ? cssVar("--critical") : sysColor(tile.key, tile.pct);
    }
    const sub = el.querySelector(".sys-sub");
    sub.textContent = tile.sub || "";
    if (note) {
      const mark = Object.assign(document.createElement("span"), {
        className: "sys-note", textContent: note,
      });
      sub.append(document.createTextNode(sub.textContent ? " · " : ""), mark);
    }
    holder.appendChild(el);
  }
}

/* ---------- public demonstration ---------- */

// Settings that live on the server are shared by everyone looking at a public
// instance, so they are shown but locked. The ones kept in the browser — theme,
// language, units, column layout — belong to the visitor and stay usable, which
// is half of what there is to try out.
const DEMO_LOCKED = [
  "set-ifaces-btn", "set-poll", "set-states", "set-enrich", "set-history",
  "set-spark", "set-idle", "set-connlimit", "set-swap", "set-save", "set-defaults",
  "set-reset-all", "set-pw-current", "set-pw-new", "set-pw-save", "set-pw-off",
  "set-listen-select", "set-url", "set-tls", "set-key", "set-secret", "set-cred-save",
];

function applyDemoMode() {
  document.body.classList.add("demo");
  for (const id of DEMO_LOCKED) {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  }
  const view = $("#view-settings");
  if (view && !$("#demo-note")) {
    const note = Object.assign(document.createElement("p"), {
      id: "demo-note", className: "demo-note", textContent: t("demo.note"),
    });
    view.prepend(note);
  }
}

/* ---------- reordering rows without them jumping ---------- */

const REORDER_MS = 280;
let flipPass = 0;
// browsers land rows on fractional pixels, so anything under half a pixel is
// not a move worth animating
const MOVE_EPSILON = 0.5;

function motionOff() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Run `mutate`, which reorders (and may add or drop) rows, and animate the
 * distance each surviving row travelled.
 *
 * Moving a row with appendChild puts it in its new place at once, which on a
 * table that resorts itself every couple of seconds reads as a flicker. So the
 * position of every row is taken first, the mutation is allowed to happen, and
 * each row is then translated back to where it was and released — the browser
 * animates it home. Reads and writes are kept in separate passes, so the whole
 * thing costs two layouts rather than two per row.
 */
function flipRows(rows, mutate) {
  const before = flipCapture(rows);
  mutate();
  flipPlay(before);
}

/** Where the rows are now. Must be called while they are still on screen. */
function flipCapture(rows) {
  if (motionOff()) return null;
  const before = new Map();
  for (const tr of Array.from(rows)) before.set(tr, tr.getBoundingClientRect().top);
  return before;
}

/** Animate each row from where `flipCapture` saw it to where it now is. */
function flipPlay(before) {
  if (!before) return;

  // Drop any transform still running from a previous pass before measuring, or
  // the new positions would be read through the old animation. Taking the start
  // positions above *with* the transform applied is deliberate: a row caught
  // mid-flight carries on from where it is instead of snapping.
  for (const tr of before.keys()) {
    tr.style.transition = "none";
    tr.style.transform = "";
  }

  const moves = [];
  for (const [tr, top] of before) {
    if (!tr.isConnected) continue;  // dropped by the mutation
    const delta = top - tr.getBoundingClientRect().top;
    if (Math.abs(delta) > MOVE_EPSILON) moves.push([tr, delta]);
  }
  if (!moves.length) {
    // nothing travelled, so put back the transitions the measurement suspended
    for (const tr of before.keys()) tr.style.transition = "";
    return;
  }

  for (const [tr, delta] of moves) tr.style.transform = `translateY(${delta}px)`;

  // Make the browser commit the rows in their old places before releasing them.
  // Without this read it recomputes style once, for a frame in which the
  // transform has already been cleared again: it sees the same value it started
  // with, has nothing to interpolate between, and starts no transition at all —
  // the rows simply appear in their new places. One read is enough for every
  // row, since it flushes the whole document.
  void moves[0][0].offsetHeight;

  for (const [tr] of moves) {
    tr.style.transition = `transform ${REORDER_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
    tr.style.transform = "";
  }
  // Every row touched here is stamped with this pass. Two tables animate on
  // their own schedules and a table can start a second pass before the first
  // has finished — clearing up by row rather than by timer means one pass never
  // strips the inline styles another one is still using.
  const pass = ++flipPass;
  const touched = Array.from(before.keys());
  for (const tr of touched) tr.dataset.flip = pass;
  setTimeout(() => {
    for (const tr of touched) {
      if (Number(tr.dataset.flip) !== pass) continue;  // a later pass owns it now
      tr.style.transition = "";
      tr.style.transform = "";
      delete tr.dataset.flip;
    }
  }, REORDER_MS + 60);
}

// A row that has just appeared has no previous position to travel from, so it
// fades in on the spot instead.
function markEntering(tr) {
  if (motionOff()) return;
  tr.classList.add("row-enter");
  requestAnimationFrame(() => requestAnimationFrame(() => tr.classList.remove("row-enter")));
}

function renderTable(forceReorder = false) {
  const tbody = $("#hosts-body");
  const visible = state.hosts.filter(hostMatches).sort(compareHosts);
  $("#empty-note").hidden = visible.length > 0;

  // only the current page's rows stay in the DOM — the rest is dropped
  const { start, end } = pageBounds("hosts", visible.length, PAGE_SIZE);
  const pageRows = visible.slice(start, end);
  renderPager($("#hosts-pager"), "hosts", visible.length, PAGE_SIZE, () => renderTable(true));

  // Tell the next poll which sparklines are wanted. When the page changes the
  // new rows have no line yet, so one is asked for straight away rather than at
  // the next tick — otherwise a fresh page draws blank for a couple of seconds.
  const wanted = pageRows.map((h) => h.ip);
  if (wanted.join() !== state.sparkIps.join()) {
    state.sparkIps = wanted;
    if (pageRows.some((h) => !h.spark.length)) schedulePoll(0);
  }

  // Everything that moves rows about happens inside one pass, so a row leaving
  // and the rows closing up behind it are part of the same animation.
  flipRows(tbody.children, () => {
    const keep = new Set(pageRows.map((h) => h.ip));
    for (const [ip, row] of state.rows) {
      if (!keep.has(ip)) {
        row.tr.remove();
        state.rows.delete(ip);
      }
    }

    for (const host of pageRows) {
      let row = state.rows.get(host.ip);
      if (!row) {
        row = buildRow(host.ip);
        state.rows.set(host.ip, row);
        tbody.appendChild(row.tr); // a new row goes to the end; sorting will place it
        markEntering(row.tr);
      }
      updateRow(row, host);
    }

    // rows are reordered only when the order actually changed and the cursor is not
    // over the table (otherwise a row slides out from under the click)
    const current = Array.from(tbody.children, (tr) => tr.dataset.ip);
    const changed = pageRows.length !== current.length || pageRows.some((h, i) => h.ip !== current[i]);
    if (changed && (forceReorder || !state.tableHover)) {
      for (const host of pageRows) tbody.appendChild(state.rows.get(host.ip).tr);
    }
  });
}

function buildRow(ip) {
  const tr = document.createElement("tr");
  tr.className = "host-row";
  tr.dataset.ip = ip;
  tr.innerHTML = `
    <td class="col-host"><span class="host-name"></span></td>
    <td class="num down"></td>
    <td class="num up"></td>
    <td class="num conns"></td>
    <td class="ip"></td>
    <td class="mac"></td>
    <td class="addr"></td>
    <td class="start dim"></td>
    <td class="uptime"></td>
    <td class="idle"></td>
    <td class="iface"></td>
    <td class="vendor dim"></td>
    <td class="peer"></td>
    <td class="num dests"></td>
    <td class="num peakdown"></td>
    <td class="num peakup"></td>
    <td class="col-spark"><canvas class="spark-canvas"></canvas></td>
    <td class="num tdown"></td>
    <td class="num tup"></td>
    <td class="filler"></td>`;
  tr.addEventListener("click", () => {
    if (state.selectedIp === ip) closeDetail(); else selectHost(ip);
  });
  applyOrderToRow(tr); // apply the saved column order
  return {
    tr,
    nameEl: tr.querySelector(".host-name"),
    ipEl: tr.querySelector(".ip"),
    macEl: tr.querySelector(".mac"),
    connsEl: tr.querySelector(".conns"),
    addrEl: tr.querySelector(".addr"),
    startEl: tr.querySelector(".start"),
    uptimeEl: tr.querySelector(".uptime"),
    idleEl: tr.querySelector(".idle"),
    ifaceEl: tr.querySelector(".iface"),
    vendorEl: tr.querySelector(".vendor"),
    peerEl: tr.querySelector(".peer"),
    destsEl: tr.querySelector(".dests"),
    peakDownEl: tr.querySelector(".peakdown"),
    peakUpEl: tr.querySelector(".peakup"),
    downEl: tr.querySelector(".down"),
    upEl: tr.querySelector(".up"),
    tdownEl: tr.querySelector(".tdown"),
    tupEl: tr.querySelector(".tup"),
    sparkCanvas: tr.querySelector(".spark-canvas"),
  };
}

function updateRow(row, host) {
  const named = Boolean(host.name);
  // no name from DNS/DHCP/ARP — show the IP (the vendor is not printed)
  row.nameEl.textContent = named ? host.name : host.ip;
  row.nameEl.title = named ? "" : host.vendor || "";
  row.nameEl.classList.toggle("unnamed", !named);
  row.ipEl.textContent = host.ip;
  row.macEl.textContent = host.mac || "";
  row.connsEl.textContent = host.conns ? String(host.conns) : "—";
  row.addrEl.textContent = t(host.dhcp ? "addr.dhcp" : "addr.static");
  if (host.first_seen) {  // compact: "29.07 16:10", the full date goes into the tooltip
    const started = new Date(host.first_seen * 1000);
    row.startEl.textContent = started.toLocaleDateString(locale(), { day: "2-digit", month: "2-digit" })
      + " " + started.toLocaleTimeString(locale(), timeOpts({ hour: "2-digit", minute: "2-digit" }));
    row.startEl.title = started.toLocaleString(locale(), timeOpts());
  } else {
    row.startEl.textContent = "";
    row.startEl.title = "";
  }
  row.uptimeEl.textContent = host.first_seen ? fmtDuration(Date.now() / 1000 - host.first_seen) : "";
  row.idleEl.textContent = host.last_seen ? fmtDuration(Date.now() / 1000 - host.last_seen) : "";
  row.ifaceEl.textContent = host.iface || "";
  row.vendorEl.textContent = host.vendor || "";
  row.vendorEl.title = host.vendor || "";
  if (host.top_peer_ip) {
    const [pv, pu] = fmtBits(host.top_peer_bps || 0);
    row.peerEl.textContent = (host.top_peer_name || host.top_peer_ip) + ` · ${pv} ${pu}`;
    row.peerEl.title = host.top_peer_ip;
  } else {
    row.peerEl.textContent = "";
    row.peerEl.title = "";
  }
  row.destsEl.textContent = host.dests ? String(host.dests) : "—";
  row.peakDownEl.textContent = fmtRate(host.peak_down || 0);
  row.peakUpEl.textContent = fmtRate(host.peak_up || 0);
  row.downEl.textContent = fmtRate(host.down);
  row.upEl.textContent = fmtRate(host.up);
  row.tdownEl.textContent = fmtMB(host.total_down);
  row.tupEl.textContent = fmtMB(host.total_up);
  row.tr.classList.toggle("host-idle", !host.active);
  row.tr.classList.toggle("selected", state.selectedIp === host.ip);
  drawSpark(row.sparkCanvas, host.spark);
}

// Every sparkline sits in the same column and every row is the same height, so
// the size is measured once for the whole table instead of once per row.
// Measuring is a forced layout, and interleaved with the writes updateRow makes
// it was the single most expensive thing on the page. `invalidateSparkBox`
// below clears it whenever the column can have changed width.
let sparkBox = null;

function invalidateSparkBox() {
  sparkBox = null;
}

function drawSpark(canvas, spark) {
  if (!sparkBox) {
    const rect = canvas.getBoundingClientRect();
    // a zero width is cached too: with the column hidden the rest of the rows
    // then bail out without measuring anything
    sparkBox = { w: rect.width, h: rect.height };
  }
  const { w, h } = sparkBox;
  if (!w || !spark.length) return;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(w * dpr);
  const height = Math.round(h * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const maxVal = Math.max(...spark.map((p) => Math.max(p[0], p[1])), 1000);
  const x = (i) => (i / Math.max(spark.length - 1, 1)) * (w - 2) + 1;
  const y = (v) => h - 2 - (v / maxVal) * (h - 4);
  for (const [idx, colorVar] of [[0, "--series-down"], [1, "--series-up"]]) {
    ctx.beginPath();
    for (let i = 0; i < spark.length; i++) {
      const px = x(i);
      const py = y(spark[i][idx]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = cssVar(colorVar);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

/* ---------- API errors ---------- */

// The API answers with a localisation key instead of ready-made text, so the same
// error reads correctly in either language. Parameterised errors arrive as
// {code, info}; anything unexpected is shown as it came.
async function apiError(res) {
  let detail = res.status;
  try {
    detail = (await res.json()).detail ?? res.status;
  } catch { /* not a JSON body */ }
  if (detail && typeof detail === "object" && detail.code) {
    return new Error(tf(detail.code, detail.info ?? ""));
  }
  if (typeof detail === "string" && detail.startsWith("err.")) {
    return new Error(t(detail));
  }
  return new Error(String(detail));
}

/* ---------- detail panel ---------- */

const panel = $("#detail-panel");

// resizing the panel by dragging its top edge
let detailHeight = parseInt(localStorage.getItem("statedash-detail-height"), 10) || 0;

function applyDetailHeight() {
  if (detailHeight) {
    panel.style.height = detailHeight + "px";
    if (!panel.hidden) vizRoot.style.paddingBottom = detailHeight + "px";
  } else {
    panel.style.height = "";
    vizRoot.style.paddingBottom = "";
  }
}

const detailResizer = $("#detail-resizer");
detailResizer.addEventListener("dblclick", () => {
  detailHeight = 0;
  localStorage.removeItem("statedash-detail-height");
  applyDetailHeight();
  histoChart.redraw();
});
detailResizer.addEventListener("mousedown", (event) => {
  event.preventDefault();
  const startY = event.clientY;
  const startH = panel.offsetHeight;
  detailResizer.classList.add("dragging");
  document.body.style.userSelect = "none";
  document.body.style.cursor = "ns-resize";
  const onMove = (ev) => {
    detailHeight = Math.min(Math.max(startH + (startY - ev.clientY), 160), Math.round(window.innerHeight * 0.9));
    applyDetailHeight();
    histoChart.redraw();
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    detailResizer.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    localStorage.setItem("statedash-detail-height", String(detailHeight));
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

function selectHost(ip) {
  state.selectedIp = ip;
  state.selectedWg = null;
  state.detailMode = "host";
  state.detail = null;
  panel.hidden = false;
  vizRoot.classList.add("with-detail");
  applyDetailHeight();
  for (const [rowIp, row] of state.rows) {
    row.tr.classList.toggle("selected", rowIp === ip);
  }
  renderDetailHead();
  switchTab(state.tab, true);
}

function closeDetail() {
  state.selectedIp = null;
  state.selectedWg = null;
  state.selectedRule = null;
  state.detailMode = null;
  state.detail = null;
  panel.hidden = true;
  vizRoot.classList.remove("with-detail");
  vizRoot.style.paddingBottom = "";
  if (state.connTimer) clearInterval(state.connTimer);
  state.connTimer = null;
  for (const row of state.rows.values()) row.tr.classList.remove("selected");
  for (const tr of document.querySelectorAll("#wg-body tr.selected")) tr.classList.remove("selected");
  for (const row of document.querySelectorAll(".rule-row.selected")) row.classList.remove("selected");
}

function currentWgPeer() {
  return (state.wgList || []).find((p) => p.public_key === state.selectedWg) || null;
}

// IP whose connections are loaded for the current panel mode
function detailConnTarget() {
  if (state.detailMode === "rule") return "rule:" + state.selectedRule;
  if (state.detailMode === "wg") {
    const peer = currentWgPeer();
    return (peer && peer.tunnel_ip) || null;
  }
  return state.selectedIp;
}

function currentHost() {
  return state.hosts.find((h) => h.ip === state.selectedIp) || null;
}

function renderDetailHead() {
  const host = currentHost();
  if (!host) return;
  $("#detail-title").textContent = host.name || host.ip;
  $("#detail-sub").textContent = host.name ? host.ip + (host.mac ? " · " + host.mac : "") : host.mac || "";
}

function switchTab(name, force = false) {
  if (!force && state.tab === name) return;
  state.tab = name;
  for (const btn of document.querySelectorAll("#detail-tabs .tab")) {
    btn.classList.toggle("active", btn.dataset.tab === name);
  }
  $("#tab-general").hidden = name !== "general";
  $("#tab-conns").hidden = name !== "conns";
  $("#tab-histo").hidden = name !== "histo";

  if (state.connTimer) clearInterval(state.connTimer);
  state.connTimer = null;

  for (const btn of document.querySelectorAll("#detail-tabs .tab")) {
    // a rule only has a connection list
    btn.hidden = state.detailMode === "rule" && btn.dataset.tab !== "conns";
  }
  if (name === "general") {
    if (state.detailMode === "wg") renderWgGeneral(); else renderGeneral();
  } else if (name === "conns") {
    const holder = $("#conn-holder");
    const target = detailConnTarget();
    if (!target) {
      holder.className = "conn-holder conn-empty";
      holder.textContent = t("conn.notunnel");
      return;
    }
    holder.className = "conn-holder conn-empty";
    holder.textContent = t("conn.loading");
    const load = () => loadConnections(target, holder);
    load();
    state.connTimer = setInterval(load, 5000);
  } else if (name === "histo") {
    if (state.detailMode === "wg") fetchWgHistory(); else fetchDetail();
  }
}

function refreshDetail() {
  renderDetailHead();
  if (state.tab === "general") renderGeneral();
  else if (state.tab === "histo") fetchDetail();
}

async function fetchDetail() {
  const ip = state.selectedIp;
  if (!ip) return;
  try {
    const res = await fetch(`/api/host/${encodeURIComponent(ip)}/detail`);
    if (!res.ok) return;
    const detail = await res.json();
    if (state.selectedIp !== ip) return;
    state.detail = detail;
    if (state.tab === "histo") histoChart.draw(detail.history);
  } catch { /* переживём один неудачный тик */ }
}

function renderGeneral() {
  const host = currentHost();
  if (!host) return;
  if (!state.detail || state.detail.ip !== host.ip) fetchDetail();
  const first = state.detail?.first_seen;
  const ifaces = state.detail?.ifaces?.join(", ");
  const [dv, du] = fmtBits(host.down);
  const [uv, uu] = fmtBits(host.up);
  const rows = [
    [t("g.name"), host.name || t("g.unknown")],
    [t("g.ip"), host.ip],
    [t("g.mac"), host.mac || t("g.unknown")],
    [t("g.vendor"), host.vendor || "—"],
    [t("g.conns"), String(host.conns || 0)],
    [t("g.iface"), ifaces || "—"],
    [t("g.first"), first ? fmtDateTime(first) : "—"],
    [t("g.down"), `${dv} ${du}`],
    [t("g.up"), `${uv} ${uu}`],
    [t("g.tdown"), fmtBytes(host.total_down)],
    [t("g.tup"), fmtBytes(host.total_up)],
  ];
  const kv = $("#general-kv");
  kv.innerHTML = "";
  for (const [key, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = value;
    kv.append(dt, dd);
  }
}

/* ---------- connections ---------- */

async function loadConnections(target, holder) {
  if (target !== lastConnTarget) { lastConnTarget = target; pageState.conns = 1; }
  try {
    const url = target.startsWith("rule:")
      ? "/api/rule/connections?key=" + encodeURIComponent(target.slice(5))
      : `/api/host/${encodeURIComponent(target)}/connections`;
    const res = await fetch(url);
    if (!res.ok) throw await apiError(res);
    const data = await res.json();
    if (detailConnTarget() !== target || state.tab !== "conns") return;
    renderConnections(holder, data.connections);
  } catch (err) {
    holder.className = "conn-holder conn-empty";
    holder.textContent = t("conn.failed") + err.message;
  }
}

// connection table sorting: {key, dir} or null (keep the incoming order)
let connSort = null;
try {
  const savedConnSort = JSON.parse(localStorage.getItem("statedash-conn-sort"));
  if (savedConnSort && savedConnSort.key) connSort = savedConnSort;
} catch { /* дефолт */ }

function connSortValue(conn, key) {
  switch (key) {
    case "dir": return conn.dir === "in" ? 0 : 1;
    case "rule": return conn.rule || "";
    case "service": return Number(conn.dst_port) || 0;
    case "src_country": return (conn.src_country && conn.src_country.code) || "";
    case "dst_country": return (conn.dst_country && conn.dst_country.code) || "";
    case "src_ip": return ipSortKey(conn.src_ip || "");
    case "dst_ip": return ipSortKey(conn.dst_ip || "");
    case "src_name": return conn.src_name || "";
    case "dst_name": return conn.dst_name || "";
    case "src_port": return Number(conn.src_port) || 0;
    case "dst_port": return Number(conn.dst_port) || 0;
    case "gateway": return conn.gateway || "";
    case "state": return conn.state || "";
    case "age": return conn.age || "";
    case "rx": return conn.rx || 0;
    case "tx": return conn.tx || 0;
    default: return 0;
  }
}

function countryCell(cls, info) {
  if (!info || !info.code) return _td(cls + " dim", "");
  if (info.code === "local") return _td(cls + " dim", "—", t("conn.local"));
  return _td(cls, `${info.flag || ""} ${info.code}`.trim());
}

function _td(className, text, title = "") {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = text;
  if (title) td.title = title;
  return td;
}

// connection table columns: label, numeric flag, cell factory
const CONN_COLS = {
  dir: {
    label: "", title: "conn.dir", num: false,
    cell: (conn, outgoing) => _td("dir", outgoing ? "←" : "→",
      t(outgoing ? "conn.out.title" : "conn.in.title")),
  },
  rule: { label: "conn.rule", num: false, cell: (conn) => _td("rule", conn.rule || "") },
  proto: {
    label: "conn.proto", num: false,
    cell: (conn) => {
      const td = document.createElement("td");
      const chip = document.createElement("span");
      chip.className = "proto-chip";
      chip.textContent = (conn.proto || "?").toUpperCase();
      td.appendChild(chip);
      return td;
    },
  },
  service: {
    label: "conn.service", num: false,
    cell: (conn) => {
      const td = document.createElement("td");
      const chip = document.createElement("span");
      chip.className = "proto-chip";
      chip.textContent = conn.service || conn.proto || "?";
      td.appendChild(chip);
      return td;
    },
  },
  src_country: { label: "conn.src_country", num: false, cell: (conn) => countryCell("src-c", conn.src_country) },
  src_ip: {
    label: "conn.src_ip", num: false,
    cell: (conn) => {
      const td = _td("src", conn.src_ip || "");
      if (conn.nat_via) {          // the source is translated on the way out — show to what
        const chip = document.createElement("span");
        chip.className = "nat-chip";
        chip.textContent = "NAT";
        chip.title = tf("conn.natvia", conn.nat_via);
        td.appendChild(document.createTextNode(" "));
        td.appendChild(chip);
      }
      return td;
    },
  },
  src_name: { label: "conn.src_name", num: false, cell: (conn) => _td("dim", conn.src_name || "") },
  src_port: { label: "conn.src_port", num: true, cell: (conn) => _td("num", conn.src_port || "") },
  dst_port: { label: "conn.dst_port", num: true, cell: (conn) => _td("num", conn.dst_port || "") },
  dst_country: { label: "conn.dst_country", num: false, cell: (conn) => countryCell("dst-c", conn.dst_country) },
  dst_ip: { label: "conn.dst_ip", num: false, cell: (conn) => _td("dst", conn.dst_ip || "") },
  dst_name: { label: "conn.dst_name", num: false, cell: (conn) => _td("dim", conn.dst_name || "") },
  gateway: { label: "conn.gw", num: false, cell: (conn) => _td("dim", conn.gateway || "") },
  rx: { label: "conn.rx", num: true, cell: (conn) => _td("num", conn.rx ? fmtBytes(conn.rx) : "—") },
  tx: { label: "conn.tx", num: true, cell: (conn) => _td("num", conn.tx ? fmtBytes(conn.tx) : "—") },
  state: { label: "conn.state", num: false, cell: (conn) => _td("st dim", conn.state) },
  age: { label: "conn.age", num: false, cell: (conn) => _td("dim", conn.age || "") },
};
const CONN_DEFAULT_ORDER = Object.keys(CONN_COLS);
// default column widths (px); the filler takes the rest of the window
// wide enough for the header text in both languages: Russian labels are the longer
// ones, and an ellipsised header is unreadable
const CONN_DEFAULT_W = {
  dir: 34, rule: 150, proto: 104, service: 130, src_country: 170, src_ip: 130, src_name: 140,
  src_port: 144, dst_port: 154, dst_country: 178, dst_ip: 130, dst_name: 140,
  gateway: 100, rx: 90, tx: 98, state: 120, age: 80,
};
const connColWidths = {};
try {
  const savedConnW = JSON.parse(localStorage.getItem("statedash-conn-widths"));
  if (savedConnW && typeof savedConnW === "object") Object.assign(connColWidths, savedConnW);
} catch { /* дефолтные ширины */ }

function applyConnWidths(table) {
  // default widths are applied only to columns the user has not resized
  for (const [key, value] of Object.entries(CONN_DEFAULT_W)) {
    if (!connColWidths[key]) connColWidths[key] = value;
  }
  applyColumnWidths(table, connColWidths);
}
// pf fills "Gateway" only with policy routing (multi-WAN), so the column is
// hidden by default — it can be switched on with the "Columns" button
const CONN_HIDDEN_DEFAULT = ["gateway"];
const connHiddenCols = localStorage.getItem("statedash-conn-hidden")
  ? loadHiddenSet("statedash-conn-hidden", CONN_DEFAULT_ORDER)
  : new Set(CONN_HIDDEN_DEFAULT);
makeColumnPicker(
  $("#conn-cols-btn"),
  CONN_DEFAULT_ORDER.map((k) => ({ key: k, label: CONN_COLS[k].label || "Направление" })),
  "statedash-conn-hidden",
  connHiddenCols,
  () => { if (state.connList) renderConnections($("#conn-holder"), state.connList); }
);
let connOrder = CONN_DEFAULT_ORDER.slice();
try {
  const saved = JSON.parse(localStorage.getItem("statedash-conn-order"));
  if (Array.isArray(saved)) {
    const order = saved.filter((key) => key in CONN_COLS);   // drop columns that no longer exist
    // new columns are inserted at their default position rather than appended,
    // and the order the user arranged is preserved
    CONN_DEFAULT_ORDER.forEach((key, i) => {
      if (order.includes(key)) return;
      const prev = CONN_DEFAULT_ORDER.slice(0, i).reverse().find((k) => order.includes(k));
      order.splice(prev ? order.indexOf(prev) + 1 : 0, 0, key);
    });
    if (order.length) connOrder = order;
  }
} catch { /* дефолтный порядок */ }

// both filters are off by default: show everything first, the user hides what they want
// pf state id -> row element, so a refresh moves the existing rows into the new
// table instead of replacing them, which is what makes them animatable
let connRows = new Map();

let hideFirewallConns = localStorage.getItem("statedash-hide-fw") === "1";
let hideLocalConns = localStorage.getItem("statedash-hide-local") === "1";

function isLocalConn(conn) {
  return conn.src_country?.code === "local" && conn.dst_country?.code === "local";
}

function isFirewallConn(conn) {
  const fw = state.firewallIps;
  if (!fw || !fw.size) return false;
  const own = state.detailMode === "host" ? state.selectedIp : null;
  // when the firewall itself is open, hide nothing
  if (own && fw.has(own)) return false;
  return fw.has(conn.src_ip) || fw.has(conn.dst_ip);
}

function renderConnections(holder, conns) {
  holder.className = "conn-holder";
  state.connList = conns;
  let hiddenCount = 0, hiddenLocal = 0;
  if (hideFirewallConns) {
    const before = conns.length;
    conns = conns.filter((c) => !isFirewallConn(c));
    hiddenCount = before - conns.length;
  }
  if (hideLocalConns) {
    const before = conns.length;
    conns = conns.filter((c) => !isLocalConn(c));
    hiddenLocal = before - conns.length;
  }
  if (!conns.length) {
    holder.className = "conn-holder conn-empty";
    holder.textContent = (hiddenCount || hiddenLocal) ? t("conn.allhidden") : t("conn.none");
    return;
  }
  if (connSort) {
    conns = conns.slice().sort((a, b) => {
      const va = connSortValue(a, connSort.key);
      const vb = connSortValue(b, connSort.key);
      const cmp = typeof va === "string" ? va.localeCompare(vb, "ru") : va - vb;
      return connSort.dir === "asc" ? cmp : -cmp;
    });
  }
  const table = document.createElement("table");
  table.className = "conn-table";
  const headRow = document.createElement("tr");
  for (const key of connOrder) {
    if (connHiddenCols.has(key)) continue;
    const meta = CONN_COLS[key];
    const th = document.createElement("th");
    th.className = "sortable" + (meta.num ? " col-num" : "");
    th.dataset.ck = key;
    th.textContent = meta.label ? t(meta.label) : "";
    if (meta.title) th.title = t(meta.title);
    th.draggable = true;
    headRow.appendChild(th);
  }
  const colgroup = document.createElement("colgroup");
  for (let i = 0; i <= headRow.children.length; i++) colgroup.appendChild(document.createElement("col"));
  table.appendChild(colgroup);
  const thead = document.createElement("thead");
  thead.appendChild(headRow);
  table.appendChild(thead);
  for (const th of Array.from(headRow.children)) {
    const key = th.dataset.ck;
    const active = connSort && connSort.key === key;
    th.classList.toggle("sorted", Boolean(active));
    if (active) th.dataset.dir = connSort.dir;
    th.addEventListener("click", () => {
      if (connSort && connSort.key === key) {
        connSort.dir = connSort.dir === "asc" ? "desc" : "asc";
      } else {
        // text ascending, traffic and direction descending
        connSort = { key, dir: ["rx", "tx", "dir"].includes(key) ? "desc" : "asc" };
      }
      localStorage.setItem("statedash-conn-sort", JSON.stringify(connSort));
      pageState.conns = 1;
      renderConnections(holder, state.connList);
    });
    // dragging a header changes the column order
    th.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/conn-col", key);
      event.dataTransfer.effectAllowed = "move";
    });
    th.addEventListener("dragover", (event) => {
      event.preventDefault();
      th.classList.add("th-dragover");
    });
    th.addEventListener("dragleave", () => th.classList.remove("th-dragover"));
    th.addEventListener("drop", (event) => {
      event.preventDefault();
      th.classList.remove("th-dragover");
      const from = event.dataTransfer.getData("text/conn-col");
      if (!from || from === key || !connOrder.includes(from)) return;
      connOrder.splice(connOrder.indexOf(from), 1);
      connOrder.splice(connOrder.indexOf(key), 0, from);
      localStorage.setItem("statedash-conn-order", JSON.stringify(connOrder));
      pageState.conns = 1;
      renderConnections(holder, state.connList);
    });
  }
  // empty filler — takes the remaining width, as in the hosts table
  const fillerTh = document.createElement("th");
  fillerTh.className = "col-filler";
  headRow.appendChild(fillerTh);
  applyConnWidths(table);
  installColumnResizers(table, {
    widths: connColWidths,
    storageKey: "statedash-conn-widths",
    onChange: () => applyConnWidths(table),
  });
  const { start, end } = pageBounds("conns", conns.length, CONN_PAGE_SIZE);
  const pageConns = conns.slice(start, end);

  // The table itself is rebuilt on every refresh, but the rows are kept and
  // moved into the new one, keyed by the pf state id. Without that identity a
  // row has no previous position and there is nothing to animate — every
  // refresh would simply blink. The cells are still rebuilt, since the columns
  // shown and their order can have changed since last time.
  // taken before the loop below moves the rows into the new table, while they
  // are still on screen and have positions to read
  const before = flipCapture(connRows.values());
  const tbody = document.createElement("tbody");
  const kept = new Map();
  for (const conn of pageConns) {
    let tr = connRows.get(conn.id);
    const fresh = !tr;
    if (fresh) tr = document.createElement("tr");
    const outgoing = conn.dir !== "in";
    // colour marks only exchange with the outside world; inside the network stays neutral
    const local = isLocalConn(conn);
    tr.className = (outgoing ? "conn-out" : "conn-in") + (local ? " conn-local" : "") + " conn-clickable";
    tr.replaceChildren();
    for (const key of connOrder) {
      if (connHiddenCols.has(key)) continue;
      tr.appendChild(CONN_COLS[key].cell(conn, outgoing));
    }
    tr.appendChild(document.createElement("td")); // filler
    tr.title = t("kill.hint");
    // assigned rather than added: a reused row must not collect a second handler
    // on every refresh
    tr.onclick = (event) => openConnMenu(event, conn, holder);
    tr.oncontextmenu = (event) => openConnMenu(event, conn, holder);
    tbody.appendChild(tr);
    kept.set(conn.id, tr);
    if (fresh) markEntering(tr);
  }
  connRows = kept;  // connections that ended drop out with it
  table.appendChild(tbody);
  holder.replaceChildren(table);
  flipPlay(before);
  if (hiddenCount || hiddenLocal) {
    const note = document.createElement("div");
    note.className = "conn-hidden-note";
    const parts = [];
    if (hiddenCount) parts.push(tf("conn.hiddenfw", hiddenCount));
    if (hiddenLocal) parts.push(tf("conn.hiddenlocal", hiddenLocal));
    note.textContent = parts.join(" · ");
    holder.appendChild(note);
  }
  const pager = document.createElement("div");
  pager.className = "pager";
  holder.appendChild(pager);
  renderPager(pager, "conns", conns.length, CONN_PAGE_SIZE, () => renderConnections(holder, state.connList));
}

/* ---------- handlers ---------- */

/* ---------- connection action menu ---------- */

const connMenu = document.createElement("div");
connMenu.className = "conn-menu";
connMenu.hidden = true;
vizRoot.appendChild(connMenu);

// drop confirmation is off by default, switched on in the settings
let killConfirm = localStorage.getItem("statedash-kill-confirm") === "1";

function hideConnMenu() { connMenu.hidden = true; }
// a click inside the menu does not bubble: when the items are rebuilt the element
// leaves the DOM in time for the global handler to treat the click as "outside"
connMenu.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", (event) => {
  if (!connMenu.hidden && !connMenu.contains(event.target)) hideConnMenu();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") hideConnMenu(); });

function menuItem(label, opts = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  if (opts.danger) btn.className = "danger";
  if (opts.disabled) btn.disabled = true;
  return btn;
}

async function killState(conn, holder) {
  try {
    const res = await fetch("/api/state/kill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: conn.id }),
    });
    if (!res.ok) throw await apiError(res);
    const data = await res.json();
    hideConnMenu();
    const target = detailConnTarget();
    if (target) loadConnections(target, holder);   // show the result straight away
    setStatusToast(tf("kill.dropped", data.killed ?? 1));
  } catch (err) {
    connMenu.innerHTML = "";
    const note = document.createElement("div");
    note.className = "conn-menu-note danger";
    note.textContent = t("kill.failed") + err.message;
    connMenu.appendChild(note);
  }
}

function setStatusToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  vizRoot.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function runAction(question, action) {
  if (!killConfirm) { action(); return; }
  askConfirm(question, action);
}

function askConfirm(question, action) {
  const saved = [...connMenu.children];
  connMenu.innerHTML = "";
  const note = document.createElement("div");
  note.className = "conn-menu-note danger";
  note.textContent = question;
  const yes = menuItem("▶ " + t("kill.yes"), { danger: true });
  yes.addEventListener("click", action);
  const no = menuItem(t("kill.cancel"));
  no.addEventListener("click", () => {  // restore the original menu
    connMenu.innerHTML = "";
    for (const child of saved) connMenu.appendChild(child);
  });
  connMenu.append(note, yes, no);
}

function openConnMenu(event, conn, holder) {
  event.preventDefault();
  event.stopPropagation();
  connMenu.innerHTML = "";

  const title = document.createElement("div");
  title.className = "conn-menu-title";
  title.textContent = `${conn.src_ip}:${conn.src_port} → ${conn.dst_ip}:${conn.dst_port}`;
  connMenu.appendChild(title);

  // step 1: actions; step 2: confirmation — dropping cannot be undone
  const killOne = menuItem(t("kill.one"), { danger: true, disabled: !conn.id });
  if (!conn.id) killOne.title = t("kill.noid");
  killOne.addEventListener("click", () => runAction(t("kill.confirm"), () => killState(conn, holder)));
  connMenu.appendChild(killOne);

  const copy = menuItem(t("kill.copy"));
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(`${conn.src_ip}:${conn.src_port} -> ${conn.dst_ip}:${conn.dst_port}`); } catch { /* без доступа к буферу */ }
    hideConnMenu();
  });
  connMenu.appendChild(copy);

  connMenu.hidden = false;
  // click coordinates are relative to the window, and the menu is fixed too
  const x = Math.min(event.clientX + 4, window.innerWidth - connMenu.offsetWidth - 8);
  const y = Math.min(event.clientY + 4, window.innerHeight - connMenu.offsetHeight - 8);
  connMenu.style.left = Math.max(x, 6) + "px";
  connMenu.style.top = Math.max(y, 6) + "px";
}

/* ---------- rule cards ---------- */

// categorical dataviz palette: fixed order, no cycling
const FLOW_COLORS = [
  "--series-down", "--series-up", "--flow-3", "--flow-4",
  "--flow-5", "--flow-6", "--flow-7", "--flow-8",
];

function zoneLabel(zone) {
  if (zone === "internet") return t("flow.internet");
  if (zone === "__other_zone__") return t("flow.other");
  if (zone === "multicast") return t("flow.multicast");
  return zone;
}

function ruleLabel(rule) {
  if (rule.key === "__other__") return t("flow.otherRules");
  return rule.descr || t("rules.noname");
}

/* ---------- "Rules" section ---------- */

let rulesTimer = null;

async function loadRules() {
  try {
    const rulesRes = await fetch("/api/rules").then((r) => r.json());
    state.rulesList = rulesRes.rules || [];
    state.paths = rulesRes.paths || [];
    state.dnat = rulesRes.dnat_nodes || [];
    state.snat = rulesRes.snat_nodes || [];
    state.ownZones = new Set(rulesRes.own_zones || []);
    state.zoneIfaces = rulesRes.zone_ifaces || {};
    state.wanZones = new Set(rulesRes.wan_zones || []);
    state.ruleConfig = {
      filter: rulesRes.filter || [],
      snat: rulesRes.snat || [],
      error: rulesRes.config_error || "",
    };
    renderRules();
    renderRuleConfig();
  } catch { /* следующий тик */ }
}

function ruleMatches(rule, needle) {
  if (!needle) return true;
  const haystack = [rule.descr, rule.rule_id, rule.top_src, rule.top_dst,
                    (rule.ifaces || []).join(" "), (rule.protos || []).join(" ")].join(" ").toLowerCase();
  return haystack.includes(needle);
}

// colours are handed out in alphabetical order of names: neighbouring nodes get
// different shades, and the diagram is not repainted when the data refreshes
function palettePicker(names) {
  const order = [...new Set(names)].sort();
  return (name) => `var(${FLOW_COLORS[order.indexOf(name) % FLOW_COLORS.length]})`;
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

// diagram geometry: three columns, nodes of equal height; width adapts to the container
const FM = { nodeH: 54, ruleH: 74, rowGap: 14, groupGap: 30, groupPad: 14, headH: 78, padX: 4, padBottom: 24 };
function fmapMetrics(avail, cols) {
  const narrow = avail < 620;
  const nodeW = narrow ? 168 : cols >= 5 ? 196 : cols === 4 ? 214 : 234;
  const minGap = narrow ? 46 : cols >= 5 ? 44 : 84;
  const colGap = Math.max(minGap, Math.min(190, (avail - cols * nodeW) / (cols - 1)));
  return { nodeW, colGap };
}

function zoneSubtitle(zone) {
  const ifaces = (state.zoneIfaces || {})[zone];
  if (ifaces && ifaces.length) {
    return tf(ifaces.length > 1 ? "map.zone.onMany" : "map.zone.on", ifaces.join(", "));
  }
  if (zone === "internet") return t("map.zone.internet");
  if (zone === "multicast") return t("map.zone.multicast");
  if (zone === "IPv6") return t("map.zone.ipv6");
  if (zone === "—") return t("map.zone.unknown");
  return t("map.zone.local");
}

function fmapNode(kind, id, title, subtitle, color) {
  const el = document.createElement(kind === "rule" ? "button" : "div");
  if (kind === "rule") el.type = "button";
  el.className = "fmap-node fmap-" + kind;
  el.dataset.node = id;
  el.style.setProperty("--accent", color);
  el.innerHTML = `<i class="fmap-bar"></i><span class="fmap-text"><span class="fmap-title"></span><span class="fmap-sub"></span></span>`;
  el.querySelector(".fmap-title").textContent = title;
  el.querySelector(".fmap-title").title = title;
  el.querySelector(".fmap-sub").textContent = subtitle;
  return el;
}

// destination ports of a rule: a line like "443/tcp · 53/udp", details go in the tooltip
function fmapPorts(rule) {
  const ports = rule.ports || [];
  const row = document.createElement("span");
  row.className = "fmap-ports";
  if (!ports.length) {
    row.classList.add("empty");
    row.textContent = t("map.ports.none");
    return row;
  }
  row.textContent = ports.slice(0, 3)
    .map((p) => p.proto ? `${p.port}/${p.proto}` : p.port).join(" · ")
    + (ports.length > 3 ? " · …" : "");
  row.title = t("map.ports.title") + "\n" + ports
    .map((p) => `${p.port}/${p.proto || "?"}${p.service ? " · " + p.service : ""}`).join("\n");
  return row;
}

function renderRules() {
  const box = $("#rule-map");
  const needle = $("#rules-search").value.trim().toLowerCase();
  const rules = new Map((state.rulesList || []).filter((r) => ruleMatches(r, needle)).map((r) => [r.key, r]));
  const dnatById = new Map((state.dnat || []).map((n) => [n.id, n]));
  const snatById = new Map((state.snat || []).map((n) => [n.id, n]));
  const paths = (state.paths || []).filter((p) => rules.has(p.rule));

  $("#rules-empty").hidden = paths.length > 0;
  box.innerHTML = "";
  if (!paths.length) return;

  // links of a path: network -> [port forward] -> rule -> [outbound NAT] -> network
  const chainOf = (p) => [
    "zs:" + p.src,
    p.dnat && dnatById.has(p.dnat) ? "dn:" + p.dnat : "",
    "ru:" + p.rule,
    p.snat && snatById.has(p.snat) ? "sn:" + p.snat : "",
    "zd:" + p.dst,
  ].filter(Boolean);

  // a NAT column is not drawn when no path has any translation
  const uniq = (prefix, list) => [...new Set(list)].map((id) => prefix + id);
  const kinds = [
    { kind: "zone", ids: uniq("zs:", paths.map((p) => p.src)) },
    { kind: "dnat", ids: uniq("dn:", paths.map((p) => p.dnat).filter((id) => id && dnatById.has(id))) },
    { kind: "rule", ids: uniq("ru:", paths.map((p) => p.rule)) },
    { kind: "snat", ids: uniq("sn:", paths.map((p) => p.snat).filter((id) => id && snatById.has(id))) },
    { kind: "zone", ids: uniq("zd:", paths.map((p) => p.dst)) },
  ].filter((c) => c.ids.length);

  const weight = new Map();
  for (const p of paths) for (const id of chainOf(p)) weight.set(id, (weight.get(id) || 0) + p.conns);

  // the first column is laid out by group and weight, every next one by the average
  // position of its predecessors: that way the links barely cross
  const own = state.ownZones || new Set();
  const wan = state.wanZones || new Set();
  const rank = (id) => {
    const zone = id.slice(3);
    return own.has(zone) ? 0 : wan.has(zone) ? 1 : 2;
  };
  // positions are normalised to 0..1 so columns of different size compare fairly
  const posOf = new Map();
  const record = (col) => {
    const n = kinds[col].ids.length;
    kinds[col].ids.forEach((id, i) => posOf.set(id, n > 1 ? i / (n - 1) : 0.5));
  };
  kinds[0].ids.sort((a, b) => rank(a) - rank(b) || weight.get(b) - weight.get(a));
  record(0);
  for (let c = 1; c < kinds.length; c++) {
    const here = new Set(kinds[c].ids);
    const bary = new Map();
    for (const p of paths) {
      const chain = chainOf(p);
      for (let k = 1; k < chain.length; k++) {
        const prev = posOf.get(chain[k - 1]);
        if (prev === undefined || !here.has(chain[k])) continue;
        const acc = bary.get(chain[k]) || { sum: 0, n: 0 };
        acc.sum += prev;
        acc.n += 1;
        bary.set(chain[k], acc);
      }
    }
    const pos = (id) => (bary.has(id) ? bary.get(id).sum / bary.get(id).n : 0.5);
    // network columns are split by group first, otherwise the frames drift apart
    const grouped = kinds[c].kind === "zone";
    kinds[c].ids.sort((a, b) => (grouped ? rank(a) - rank(b) : 0)
      || pos(a) - pos(b) || weight.get(b) - weight.get(a));
    record(c);
  }

  const { nodeW, colGap } = fmapMetrics(box.clientWidth - FM.padX * 2, kinds.length);
  const zoneColor = palettePicker(paths.flatMap((p) => [p.src, p.dst]));
  const ruleColor = palettePicker(paths.map((p) => p.rule));

  const nodeH = (col) => (kinds[col].kind === "rule" ? FM.ruleH : FM.nodeH);
  const layoutCol = (col) => {
    const ys = [];
    let y = 0, prev = null;
    kinds[col].ids.forEach((id, i) => {
      const r = kinds[col].kind === "zone" ? rank(id) : 0;
      if (i && r !== prev) y += FM.groupGap;
      ys.push(y);
      y += nodeH(col) + FM.rowGap;
      prev = r;
    });
    return { ys, height: Math.max(y - FM.rowGap, 0) };
  };
  const layouts = kinds.map((_, col) => layoutCol(col));
  const maxH = Math.max(...layouts.map((l) => l.height));
  const width = FM.padX * 2 + kinds.length * nodeW + (kinds.length - 1) * colGap;
  const height = FM.headH + maxH + FM.padBottom;
  const colX = (i) => FM.padX + i * (nodeW + colGap);
  const nodeY = (col, i) => FM.headH + (maxH - layouts[col].height) / 2 + layouts[col].ys[i];
  const centerY = (col, i) => nodeY(col, i) + nodeH(col) / 2;
  const at = new Map();
  kinds.forEach((c, col) => c.ids.forEach((id, i) => at.set(id, { col, i })));

  const canvas = document.createElement("div");
  canvas.className = "fmap-canvas";
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // frame around everything happening inside the firewall: forwarding, rules, NAT
  const inside = kinds.map((c, i) => (c.kind === "zone" ? -1 : i)).filter((i) => i >= 0);
  const fw = document.createElement("div");
  fw.className = "fmap-group";
  fw.style.left = (colX(inside[0]) - 20) + "px";
  fw.style.top = (FM.headH - 14) + "px";
  fw.style.width = (colX(inside[inside.length - 1]) + nodeW - colX(inside[0]) + 40) + "px";
  fw.style.height = (height - FM.headH + 10) + "px";
  fw.innerHTML = '<span class="fmap-group-label right"></span>';
  fw.querySelector(".fmap-group-label").textContent = t("map.group.fw");
  canvas.appendChild(fw);

  const addGroup = (col, first, count, label, side) => {
    const top = nodeY(col, first) - FM.groupPad;
    const bottom = nodeY(col, first + count - 1) + nodeH(col) + FM.groupPad;
    const group = document.createElement("div");
    group.className = "fmap-group";
    group.style.left = (colX(col) - FM.groupPad) + "px";
    group.style.top = top + "px";
    group.style.width = (nodeW + FM.groupPad * 2) + "px";
    group.style.height = (bottom - top) + "px";
    group.innerHTML = '<span class="fmap-group-label ' + side + '"></span>';
    group.querySelector(".fmap-group-label").textContent = label;
    canvas.appendChild(group);
  };
  kinds.forEach((c, col) => {
    if (c.kind !== "zone") return;
    const side = col === kinds.length - 1 ? "right" : "left";
    const ownCount = c.ids.filter((id) => own.has(id.slice(3))).length;
    const wanCount = c.ids.filter((id) => wan.has(id.slice(3))).length;
    if (ownCount) addGroup(col, 0, ownCount, t("map.group.own"), side);
    if (wanCount) addGroup(col, ownCount, wanCount, t("map.group.wan"), side);
  });

  const TITLES = { dnat: "map.col.dnat", rule: "map.col.rules", snat: "map.col.snat" };
  kinds.forEach((c, col) => {
    const head = document.createElement("div");
    head.className = "fmap-col-title";
    head.style.left = colX(col) + "px";
    head.style.maxWidth = (nodeW + 40) + "px";
    head.textContent = c.kind === "zone"
      ? t(col === 0 ? "map.col.src" : "map.col.dst")
      : t(TITLES[c.kind]);
    canvas.appendChild(head);
  });

  const svg = svgEl("svg", { class: "fmap-links", viewBox: "0 0 " + width + " " + height,
                             width: width, height: height });
  canvas.appendChild(svg);

  const place = (el, col, i) => {
    el.style.left = colX(col) + "px";
    el.style.top = nodeY(col, i) + "px";
    el.style.width = nodeW + "px";
    el.style.height = nodeH(col) + "px";
    canvas.appendChild(el);
  };
  kinds.forEach((c, col) => c.ids.forEach((id, i) => {
    const body = id.slice(3);
    let el;
    if (c.kind === "zone") {
      el = fmapNode("zone", id, zoneLabel(body), zoneSubtitle(body), zoneColor(body));
    } else if (c.kind === "dnat") {
      const n = dnatById.get(body);
      el = fmapNode("dnat", id, n.title, "-> " + n.sub, "var(--flow-4)");
      el.querySelector(".fmap-sub").textContent = "→ " + n.sub;
    } else if (c.kind === "snat") {
      const n = snatById.get(body);
      el = fmapNode("snat", id, n.title || t(n.auto ? "map.snat.auto" : "rules.noname"),
                    n.sub, "var(--flow-5)");
    } else {
      const rule = rules.get(body);
      const sub = [rule.rule_id ? "#" + rule.rule_id : "", (rule.ifaces || []).join(", "),
                   (rule.ports || []).length ? "" : (rule.protos || []).join("/"),
                  ].filter(Boolean).join(" · ");
      el = fmapNode("rule", id, rule.descr || t("rules.noname"), sub, ruleColor(body));
      el.querySelector(".fmap-text").appendChild(fmapPorts(rule));
      if (state.selectedRule === body) el.classList.add("selected");
      el.addEventListener("click", () => {
        if (state.selectedRule === body) closeDetail(); else selectRule(rule);
      });
    }
    place(el, col, i);
  }));

  // one segment can belong to several paths — keep them in a set
  const members = new Map();
  const segs = new Map();
  for (const p of paths) {
    const chain = chainOf(p);
    const color = ruleColor(p.rule);
    for (let k = 1; k < chain.length; k++) {
      const a = at.get(chain[k - 1]), b = at.get(chain[k]);
      if (!a || !b) continue;
      const seg = chain[k - 1] + ">" + chain[k] + ">" + p.rule;
      let g = segs.get(seg);
      if (!g) {
        const x1 = colX(a.col) + nodeW, y1 = centerY(a.col, a.i);
        const x2 = colX(b.col), y2 = centerY(b.col, b.i);
        const dx = (x2 - x1) * 0.45;
        g = svgEl("g", { class: "fmap-link" });
        g.appendChild(svgEl("path", {
          class: "fmap-line",
          d: "M" + x1 + "," + y1 + " C" + (x1 + dx) + "," + y1 + " " + (x2 - dx) + "," + y2
             + " " + (x2 - 9) + "," + y2,
          stroke: color, fill: "none",
        }));
        g.appendChild(svgEl("path", {
          class: "fmap-head",
          d: "M" + (x2 - 9) + "," + (y2 - 5) + " L" + x2 + "," + y2 + " L" + (x2 - 9) + "," + (y2 + 5) + " Z",
          fill: color,
        }));
        svg.appendChild(g);
        segs.set(seg, g);
        members.set(g, new Set());
      }
      for (const node of chain) members.get(g).add(node);
    }
  }

  const focus = (id) => {
    canvas.classList.toggle("focused", Boolean(id));
    const near = new Set();
    for (const [g, nodes] of members) {
      const on = Boolean(id) && nodes.has(id);
      g.classList.toggle("on", on);
      if (on) for (const n of nodes) near.add(n);
    }
    for (const n of canvas.querySelectorAll(".fmap-node")) {
      n.classList.toggle("on", Boolean(id) && near.has(n.dataset.node));
    }
  };
  for (const n of canvas.querySelectorAll(".fmap-node")) {
    n.addEventListener("mouseenter", () => focus(n.dataset.node));
    n.addEventListener("mouseleave", () => focus(null));
    n.addEventListener("focus", () => focus(n.dataset.node));
    n.addEventListener("blur", () => focus(null));
  }

  box.appendChild(canvas);
}

let cfgKind = localStorage.getItem("statedash-cfg-kind") === "snat" ? "snat" : "filter";
let cfgHideAuto = localStorage.getItem("statedash-cfg-hideauto") !== "0";

function renderRuleConfig() {
  const box = $("#cfg-list");
  const errorBox = $("#cfg-error");
  const data = state.ruleConfig || {};
  if (data.error) {
    errorBox.hidden = false;
    errorBox.textContent = /403/.test(data.error) ? t("cfg.noaccess") : t("cfg.error") + data.error;
    box.innerHTML = "";
    return;
  }
  errorBox.hidden = true;

  let rows = (cfgKind === "snat" ? data.snat : data.filter) || [];
  if (cfgKind === "filter" && cfgHideAuto) rows = rows.filter((r) => !r.automatic);
  box.innerHTML = "";
  if (!rows.length) {
    box.innerHTML = `<div class="empty-note">${t("cfg.empty")}</div>`;
    return;
  }

  const head = document.createElement("div");
  head.className = "cfg-head";
  head.innerHTML = `<span>${t(cfgKind === "snat" ? "cfg.h.nat" : "cfg.h.action")}</span>`
    + `<span>${t("cfg.h.iface")}</span><span>${t("cfg.h.src")}</span><span></span>`
    + `<span>${t("cfg.h.dst")}</span><span>${t("cfg.h.descr")}</span>`
    + `<span class="cfg-use">${t("cfg.h.use")}</span>`;
  box.appendChild(head);

  for (const rule of rows) {
    const row = document.createElement("div");
    row.className = "cfg-row" + (!rule.enabled ? " disabled" : (rule.conns ? "" : " inactive"));
    const src = rule.source + (rule.source_port ? ":" + rule.source_port : "");
    const dst = rule.destination + (rule.destination_port ? ":" + rule.destination_port : "");
    row.innerHTML = `
      <span class="cfg-act"></span>
      <span class="cfg-iface"></span>
      <span class="cfg-addr src"></span>
      <span class="cfg-arrow">→</span>
      <span class="cfg-addr dst"></span>
      <span class="cfg-descr"></span>
      <span class="cfg-use"></span>`;
    const act = row.querySelector(".cfg-act");
    if (cfgKind === "snat") {
      act.textContent = rule.target || t("cfg.nat.wanaddr");
      act.title = t("cfg.nat.hint");
    } else {
      act.textContent = rule.action || "—";
      act.classList.add(rule.action || "");
    }
    row.querySelector(".cfg-iface").textContent = rule.interface || "—";
    row.querySelector(".src").textContent = src;
    row.querySelector(".src").title = src;
    row.querySelector(".dst").textContent = dst;
    row.querySelector(".dst").title = dst;
    const descr = row.querySelector(".cfg-descr");
    descr.textContent = rule.description || (rule.automatic ? t("cfg.auto") : "—");
    descr.title = rule.description || "";
    const use = row.querySelector(".cfg-use");
    if (cfgKind === "snat") {
      use.textContent = rule.enabled ? "" : t("cfg.off");
      use.classList.add("idle");
    } else if (rule.conns) {
      use.textContent = tf("cfg.active", rule.conns);
      use.title = fmtBytes(rule.bytes);
    } else {
      use.textContent = rule.enabled ? t("cfg.idle") : t("cfg.off");
      use.classList.add("idle");
    }
    // clicking an active rule opens its connections
    if (rule.conns) {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => {
        const full = (state.rulesList || []).find((r) => r.key === rule.uuid);
        if (full) { if (state.selectedRule === rule.uuid) closeDetail(); else selectRule(full); }
      });
    }
    box.appendChild(row);
  }
}

function selectRule(rule) {
  state.selectedIp = null;
  state.selectedWg = null;
  state.selectedRule = rule.key;
  state.detailMode = "rule";
  panel.hidden = false;
  vizRoot.classList.add("with-detail");
  applyDetailHeight();
  $("#detail-title").textContent = rule.descr || t("rules.noname");
  $("#detail-sub").textContent = [t("rules.detail"), rule.rule_id ? "#" + rule.rule_id : "",
                                  (rule.ifaces || []).join(", ")].filter(Boolean).join(" · ");
  state.tab = "conns";  // only the connections tab makes sense for a rule
  switchTab("conns", true);
  renderRules();
  if (state.ruleConfig) renderRuleConfig();
}

/* ---------- VPN · WireGuard section ---------- */

let wgTimer = null;
let blockedTimer = null;

// whole numbers, grouped the way the locale expects — the same treatment the
// rate columns get
function fmtCount(n) {
  return Math.round(n).toLocaleString(locale());
}

let blockedFold = true;
let blockedFilter = "";

// The same resizer the hosts and connections tables use — widths live in a
// plain {key: px} object and are written into the colgroup.
const blkWidths = {};
try {
  const saved = JSON.parse(localStorage.getItem("statedash-blk-widths"));
  if (saved && typeof saved === "object") Object.assign(blkWidths, saved);
} catch { /* битое значение — остаёмся на автоширине */ }

function applyBlkWidths() {
  applyColumnWidths($("#blk-table"), blkWidths, new Set());
}

/* ---------- "Blocked" section ---------- */

async function loadBlocked() {
  try {
    const res = await fetch("/api/blocked");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    // No privilege for the firewall log: hide the section rather than show an
    // error for something the operator chose not to grant.
    $("#nav-blocked").hidden = !data.available;
    if (!data.available) {
      if (!$("#view-blocked").hidden) switchView("hosts");
      return;
    }

    const c = data.counts || {};
    $("#blk-attempt").textContent = fmtCount(c.attempt || 0);
    $("#blk-late").textContent = fmtCount(c.late || 0);
    $("#blk-noise").textContent = fmtCount(c.broadcast || 0);
    // the tile only stands out when there is in fact something to look at
    $(".blk-attempt").classList.toggle("blk-hot", (c.attempt || 0) > 0);

    renderBlocked(data.groups || []);
  } catch (err) {
    $("#nav-blocked").hidden = true;
  }
}

function renderBlocked(groups) {
  const needle = blockedFilter.trim().toLowerCase();
  const rows = groups.filter((g) => {
    if (blockedFold && g.kind === "broadcast") return false;
    if (!needle) return true;
    return [g.src, g.dst, g.port, g.proto, g.rule, g.src_name, g.dst_name]
      .some((v) => String(v || "").toLowerCase().includes(needle));
  });

  const { start, end } = pageBounds("blocked", rows.length, PAGE_SIZE);
  const pageRows = rows.slice(start, end);
  renderPager($("#blk-pager"), "blocked", rows.length, PAGE_SIZE, () => renderBlocked(groups));

  const body = $("#blk-body");
  body.replaceChildren(...pageRows.map((g) => {
    const tr = document.createElement("tr");
    if (g.kind === "broadcast") tr.className = "blk-noise-row";

    const kind = document.createElement("span");
    kind.className = "blk-pill blk-pill-" + g.kind;
    kind.textContent = t("blk.kind." + g.kind);

    const service = g.port
      ? `${g.port}/${g.proto}` + (g.service ? ` · ${g.service}` : "")
      : "—";
    const flag = (g.dst_country && g.dst_country.flag) || "";

    for (const cell of [
      kind, g.rule || "—", g.src, g.src_name || "—",
      g.dst + (flag ? " " + flag : ""), service,
      fmtCount(g.count), fmtClock(g.last),
    ]) {
      const td = document.createElement("td");
      if (cell instanceof Node) td.append(cell); else td.textContent = cell;
      tr.append(td);
    }
    return tr;
  }));

  const hiddenNoise = blockedFold && groups.some((g) => g.kind === "broadcast");
  $("#blk-empty").hidden = rows.length > 0 || hiddenNoise;
  $("#blk-empty").textContent = rows.length === 0 && hiddenNoise
    ? t("blk.allnoise") : t("blk.empty");
}


function fmtAgo(epoch) {
  if (!epoch) return t("ago.never");
  const seconds = Math.max(Math.round(Date.now() / 1000 - epoch), 0);
  if (seconds < 10) return t("ago.now");
  if (seconds < 60) return tf("ago.sec", seconds);
  if (seconds < 3600) return tf("ago.min", Math.round(seconds / 60));
  if (seconds < 86400) return tf("ago.hour", Math.round(seconds / 3600));
  return fmtDateTime(epoch);
}

async function loadWg() {
  try {
    const res = await fetch("/api/wireguard");
    const data = await res.json();
    const errorBanner = $("#wg-error");
    if (data.error) {
      errorBanner.hidden = false;
      errorBanner.textContent = /403/.test(data.error)
        ? t("wg.noaccess")
        : t("wg.err") + data.error;
    } else {
      errorBanner.hidden = true;
    }
    renderWg(data.peers || []);
    if (state.detailMode === "wg") {
      if (!currentWgPeer()) {
        closeDetail();
      } else {
        renderWgDetailHead();
        if (state.tab === "general") renderWgGeneral();
        else if (state.tab === "histo") fetchWgHistory();
      }
    }
  } catch { /* следующий тик попробует снова */ }
}

const WG_COL_DEFS = [
  ["name", "wg.name", ".wg-name"], ["status", "wg.status", ".wgst"], ["endpoint", "Endpoint", ".ep"],
  ["ips", "wg.ips", ".ips"], ["hs", "wg.hs", ".hs"], ["rx", "conn.rx", ".rx"],
  ["tx", "conn.tx", ".tx"], ["trx", "wg.trx", ".trx"], ["ttx", "wg.ttx", ".ttx"],
];
const wgHiddenCols = loadHiddenSet("statedash-wg-hidden", WG_COL_DEFS.map((d) => d[0]));
const WG_SEL = Object.fromEntries(WG_COL_DEFS.map(([key, , sel]) => [key, sel]));
const WG_DEFAULT_ORDER = WG_COL_DEFS.map((d) => d[0]);

let wgOrder = WG_DEFAULT_ORDER.slice();
try {
  const savedWgOrder = JSON.parse(localStorage.getItem("statedash-wg-order"));
  // apply only when the set of columns matches
  if (Array.isArray(savedWgOrder) && savedWgOrder.length === WG_DEFAULT_ORDER.length
      && WG_DEFAULT_ORDER.every((k) => savedWgOrder.includes(k))) wgOrder = savedWgOrder;
} catch { /* дефолтный порядок */ }

function applyWgColVisibility() {
  applyWgWidths();  // the shared helper sets both widths and visibility
}

function applyWgOrderToRow(tr) {
  for (const key of wgOrder) {
    const cell = tr.querySelector(WG_SEL[key]);
    if (cell) tr.appendChild(cell);
  }
  const filler = tr.querySelector(".wg-filler");
  if (filler) tr.appendChild(filler);
}

function applyWgOrder() {
  const headRow = $("#wg-table").tHead.rows[0];
  for (const key of wgOrder) {
    const th = headRow.querySelector(`th[data-col="${key}"]`);
    if (th) headRow.appendChild(th);
  }
  headRow.appendChild(headRow.querySelector('th[data-col="filler"]'));
  for (const tr of $("#wg-body").rows) applyWgOrderToRow(tr);
  applyWgColVisibility();
  applyWgWidths();
}

const wgColWidths = {};
try {
  const savedW = JSON.parse(localStorage.getItem("statedash-wg-widths"));
  if (savedW && typeof savedW === "object") Object.assign(wgColWidths, savedW);
} catch { /* ширины по умолчанию */ }

function applyWgWidths() {
  applyColumnWidths($("#wg-table"), wgColWidths, wgHiddenCols);
}

installColumnResizers($("#wg-table"), {
  widths: wgColWidths,
  storageKey: "statedash-wg-widths",
  onChange: applyWgWidths,
});

// header dragging and resizing — as in the other tables
for (const th of document.querySelectorAll("#wg-table thead th")) {
  th.draggable = th.dataset.col !== "filler";
  th.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/wg-col", th.dataset.col);
    event.dataTransfer.effectAllowed = "move";
  });
  th.addEventListener("dragover", (event) => {
    event.preventDefault();
    th.classList.add("th-dragover");
  });
  th.addEventListener("dragleave", () => th.classList.remove("th-dragover"));
  th.addEventListener("drop", (event) => {
    event.preventDefault();
    th.classList.remove("th-dragover");
    const from = event.dataTransfer.getData("text/wg-col");
    const to = th.dataset.col;
    if (!from || from === to || !wgOrder.includes(from)) return;
    wgOrder.splice(wgOrder.indexOf(from), 1);
    if (to === "filler") wgOrder.push(from);
    else wgOrder.splice(wgOrder.indexOf(to), 0, from);
    localStorage.setItem("statedash-wg-order", JSON.stringify(wgOrder));
    applyWgOrder();
  });
}

applyWgOrder();
makeColumnPicker(
  $("#wg-cols-btn"),
  WG_COL_DEFS.map(([key, label]) => ({ key, label })),
  "statedash-wg-hidden",
  wgHiddenCols,
  () => { applyWgOrder(); renderWg(state.wgList || []); }
);

function selectWgPeer(peer) {
  state.selectedIp = null;
  state.selectedWg = peer.public_key;
  state.detailMode = "wg";
  panel.hidden = false;
  vizRoot.classList.add("with-detail");
  applyDetailHeight();
  for (const row of state.rows.values()) row.tr.classList.remove("selected");
  renderWgDetailHead();
  switchTab(state.tab, true);
  renderWg(state.wgList || []);
}

function renderWgDetailHead() {
  const peer = currentWgPeer();
  if (!peer) return;
  $("#detail-title").textContent = peer.name || peer.public_key.slice(0, 12) + "…";
  const parts = [];
  if (peer.tunnel_ip) parts.push(peer.tunnel_ip);
  if (peer.endpoint) parts.push(peer.endpoint);
  $("#detail-sub").textContent = "WireGuard · " + (parts.join(" · ") || peer.iface);
}

function renderWgGeneral() {
  const peer = currentWgPeer();
  if (!peer) return;
  const now = Date.now() / 1000;
  const online = peer.handshake && now - peer.handshake < 180;
  const [rxv, rxu] = fmtBits(peer.rx_bps || 0);
  const [txv, txu] = fmtBits(peer.tx_bps || 0);
  const rows = [
    [t("wg.name"), peer.name || "—"],
    [t("wg.status"), t(online ? "wg.online" : "wg.offline")],
    [t("g.iface"), peer.iface || "—"],
    ["Endpoint", peer.endpoint || "—"],
    [t("wgg.allowed"), peer.allowed_ips || "—"],
    [t("wgg.tunnel"), peer.tunnel_ip || "—"],
    [t("wgg.pub"), peer.public_key],
    [t("wgg.hs"), fmtAgo(peer.handshake)],
    [t("wgg.rxnow"), online ? `${rxv} ${rxu}` : "—"],
    [t("wgg.txnow"), online ? `${txv} ${txu}` : "—"],
    [t("wgg.trx"), fmtBytes(peer.rx)],
    [t("wgg.ttx"), fmtBytes(peer.tx)],
  ];
  const kv = $("#general-kv");
  kv.innerHTML = "";
  for (const [key, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = value;
    kv.append(dt, dd);
  }
}

async function fetchWgHistory() {
  const peer = currentWgPeer();
  if (!peer) return;
  try {
    const res = await fetch("/api/wireguard/history?key=" + encodeURIComponent(peer.public_key));
    if (!res.ok) return;
    const data = await res.json();
    if (state.detailMode === "wg" && state.tab === "histo") histoChart.draw(data.history);
  } catch { /* следующий тик */ }
}

function renderWg(peers) {
  state.wgList = peers;
  const tbody = $("#wg-body");
  $("#wg-empty").hidden = peers.length > 0;
  tbody.innerHTML = "";
  const now = Date.now() / 1000;
  peers.sort((a, b) => (b.handshake || 0) - (a.handshake || 0));
  for (const peer of peers) {
    const online = peer.handshake && now - peer.handshake < 180;
    const tr = document.createElement("tr");
    tr.className = "wg-row" + (peer.public_key === state.selectedWg ? " selected" : "");
    tr.addEventListener("click", () => {
      if (state.selectedWg === peer.public_key) closeDetail(); else selectWgPeer(peer);
    });
    tr.innerHTML = `
      <td class="wg-name"></td>
      <td class="wgst"><span class="wg-status"><span class="wg-dot"></span><span class="wg-state"></span></span></td>
      <td class="dim ep"></td>
      <td class="dim ips"></td>
      <td class="dim hs"></td>
      <td class="num rx"></td>
      <td class="num tx"></td>
      <td class="num trx"></td>
      <td class="num ttx"></td>
      <td class="wg-filler"></td>`;
    for (const [key, , sel] of WG_COL_DEFS) {
      if (wgHiddenCols.has(key)) tr.querySelector(sel).style.display = "none";
    }
    applyWgOrderToRow(tr);
    tr.querySelector(".wg-name").textContent = peer.name || peer.public_key.slice(0, 12) + "…";
    tr.querySelector(".wg-dot").classList.toggle("online", Boolean(online));
    tr.querySelector(".wg-state").textContent = t(online ? "wg.online" : "wg.offline");
    tr.querySelector(".ep").textContent = peer.endpoint || "—";
    tr.querySelector(".ips").textContent = peer.allowed_ips || "—";
    tr.querySelector(".hs").textContent = fmtAgo(peer.handshake);
    const [rxv, rxu] = fmtBits(peer.rx_bps || 0);
    const [txv, txu] = fmtBits(peer.tx_bps || 0);
    tr.querySelector(".rx").textContent = online ? `${rxv} ${rxu}` : "—";
    tr.querySelector(".tx").textContent = online ? `${txv} ${txu}` : "—";
    tr.querySelector(".trx").textContent = fmtBytes(peer.rx);
    tr.querySelector(".ttx").textContent = fmtBytes(peer.tx);
    tbody.appendChild(tr);
  }
}

/* ---------- switching sections ---------- */

function switchView(name) {
  for (const item of document.querySelectorAll(".side-item")) {
    if (item.dataset.view) item.classList.toggle("active", item.dataset.view === name);
  }
  $("#view-hosts").hidden = name !== "hosts";
  $("#view-history").hidden = name !== "history";
  $("#view-wg").hidden = name !== "wg";
  $("#view-blocked").hidden = name !== "blocked";
  $("#view-rules").hidden = name !== "rules";
  $("#view-settings").hidden = name !== "settings";
  closeDetail(); // the detail panel belongs to one section
  if (historyTimer) { clearInterval(historyTimer); historyTimer = null; }
  if (wgTimer) { clearInterval(wgTimer); wgTimer = null; }
  if (rulesTimer) { clearInterval(rulesTimer); rulesTimer = null; }
  if (blockedTimer) { clearInterval(blockedTimer); blockedTimer = null; }
  if (name === "history") {
    // the peers are needed for the device picker and are not polled otherwise
    if (!state.wgList) loadWg();
    loadHistoryView();
  } else if (name === "blocked") {
    loadBlocked();
    blockedTimer = setInterval(loadBlocked, 10000);
  } else if (name === "wg") {
    loadWg();
    wgTimer = setInterval(loadWg, 10000);
  } else if (name === "rules") {
    loadRules();
    rulesTimer = setInterval(loadRules, 10000);
  } else if (name === "settings") {
    loadSettings();
  }
}

/* ---------- "Settings" section ---------- */

// form field -> server setting key
const SERVER_FIELDS = {
  "#set-poll": "poll_seconds",
  "#set-states": "states_seconds",
  "#set-enrich": "enrich_seconds",
  "#set-history": "history_points",
  "#set-spark": "spark_points",
  "#set-idle": "idle_seconds",
  "#set-connlimit": "conn_limit",
  "#set-swap": "direction_swap",
};

function setStatus(text, isError = false) {
  const el = $("#set-status");
  el.textContent = text;
  el.style.color = isError ? "var(--critical)" : "";
  if (text) setTimeout(() => { if (el.textContent === text) el.textContent = ""; }, 6000);
}

function fillClientSettings() {
  $("#set-lang").value = lang;
  $("#set-theme").value = document.documentElement.dataset.theme || "system";
  $("#set-units").value = rateUnit;
  $("#set-chart").checked = chartsShown();
  $("#set-kill-confirm").checked = killConfirm;
  $("#set-timefmt").value = timeFormat;
  $("#set-nav").checked = document.body.classList.contains("nav-collapsed");
}

function setAuthStatus(text, isError = false) {
  const el = $("#set-auth-status");
  el.textContent = text;
  el.style.color = isError ? "var(--critical)" : "";
  if (text) setTimeout(() => { if (el.textContent === text) el.textContent = ""; }, 6000);
}

async function loadListen() {
  try {
    const [res, authRes] = await Promise.all([
      fetch("/api/listen").then((r) => r.json()),
      fetch("/api/auth/status").then((r) => r.json()).catch(() => ({})),
    ]);
    const select = $("#set-listen-select");
    // a custom value from .env is added to the list so it is not lost
    if (![...select.options].some((o) => o.value === res.value)) {
      const opt = document.createElement("option");
      opt.value = res.value;
      opt.textContent = res.value;
      select.appendChild(opt);
    }
    select.value = res.value;
    select.disabled = !res.writable;
    $("#set-listen-now").textContent = res.effective + " · "
      + t(res.effective.startsWith("127.") ? "set.listen.local" : "set.listen.public");
    const pending = $("#set-listen-pending");
    pending.hidden = !res.pending;
    pending.textContent = tf("set.listen.pending", res.value);
    // exposed to the network without a password — warn about it
    $("#set-listen-warn").hidden = !(!res.effective.startsWith("127.") && authRes.enabled === false);
  } catch { /* следующий заход */ }
}

async function loadAuthState() {
  try {
    const res = await fetch("/api/auth/status");
    const data = await res.json();
    $("#set-auth-state").textContent = t(data.enabled ? "set.pw.on.state" : "set.pw.off.state");
    $("#set-auth-state").style.color = data.enabled ? "" : "var(--series-up)";
    $("#set-current-row").hidden = !data.enabled;
    $("#set-pw-off").hidden = !data.enabled;
    $("#set-logout").hidden = !data.enabled;
    $("#logout-btn").hidden = !data.enabled;
  } catch { /* оставляем как есть */ }
}

async function loadCredentials() {
  try {
    const res = await fetch("/api/credentials");
    const data = await res.json();
    $("#set-url").value = data.url || "";
    $("#set-tls").checked = Boolean(data.tls_verify);
    const rows = [
      [t("set.env.key"), (data.key_mask || "—") + " · " + t(data.from_env ? "set.env.source.env" : "set.env.source.ui")],
      [t("set.env.secret"), data.secret_mask || "—"],
      [t("set.env.mock"), t(data.mock ? "yes" : "no")],
    ];
    const kv = $("#set-env");
    kv.innerHTML = "";
    for (const [key, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = value;
      kv.append(dt, dd);
    }
  } catch { /* следующий заход */ }
}

let ifaceList = [];                 // [{name,label,device}]
let ifaceSelected = new Set();      // selected names

const ifacePickers = [];   // every interface picker (header and settings)

function ifaceLabelText() {
  const labels = ifaceList.filter((i) => ifaceSelected.has(i.name)).map((i) => i.label || i.name);
  return labels.length ? labels.join(", ") : t("set.ifaces.none");
}

function renderIfaceButton() {
  for (const picker of ifacePickers) picker.render();
}

function buildIfaceMenu(pop, onToggle) {
  pop.innerHTML = "";
  for (const iface of ifaceList) {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = ifaceSelected.has(iface.name);
    cb.addEventListener("change", () => {
      // Unticking the last one used to leave every box empty while the server
      // kept polling the previous set, because an empty value was never sent.
      // Watching nothing has no use anyway, so refuse the click rather than let
      // the picker show something that is not true.
      if (!cb.checked && ifaceSelected.size <= 1) {
        cb.checked = true;
        setStatusToast(t("top.ifaces.last"));
        return;
      }
      if (cb.checked) ifaceSelected.add(iface.name); else ifaceSelected.delete(iface.name);
      onToggle();
    });
    const text = document.createElement("span");
    text.textContent = iface.label || iface.name;
    label.append(cb, text);
    if (iface.device) {
      const dev = document.createElement("span");
      dev.className = "iface-dev";
      dev.textContent = iface.device;
      label.append(dev);
    }
    label.title = iface.name;
    pop.appendChild(label);
  }
}

const ifaceMenu = document.createElement("div");
ifaceMenu.className = "col-picker";
ifaceMenu.hidden = true;
vizRoot.appendChild(ifaceMenu);
ifaceMenu.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", (event) => {
  if (!ifaceMenu.hidden && !ifaceMenu.contains(event.target)) ifaceMenu.hidden = true;
});

async function applyIfacesNow() {
  const value = selectedIfaces();
  if (!value) return;   // belt and braces: the picker no longer allows it
  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ifaces: value }),
    });
    if (!res.ok) throw new Error(res.status);
    setStatusToast(t("top.ifaces.saved"));
  } catch (err) {
    setStatusToast(t("set.savefail") + err.message);
  }
}

/**
 * Interface picker button — one component for the header and the settings page.
 * instant=true — changes apply at once; otherwise they wait for "Save".
 */
function createIfacePicker(button, { instant = false } = {}) {
  const textEl = document.createElement("span");
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "▾";
  button.replaceChildren(textEl, caret);

  const picker = { render: () => { textEl.textContent = ifaceLabelText(); } };
  ifacePickers.push(picker);
  picker.render();

  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (!ifaceMenu.hidden) { ifaceMenu.hidden = true; return; }
    if (!ifaceList.length) await loadInterfaces();   // the list is fetched on first open
    buildIfaceMenu(ifaceMenu, () => {
      renderIfaceButton();
      if (instant) applyIfacesNow();
    });
    const rect = button.getBoundingClientRect();
    ifaceMenu.style.top = rect.bottom + 6 + "px";
    ifaceMenu.style.left = Math.max(Math.min(rect.left, window.innerWidth - 210), 8) + "px";
    ifaceMenu.style.minWidth = Math.max(rect.width, 170) + "px";
    ifaceMenu.hidden = false;
  });
  return picker;
}

$("#blk-fold").addEventListener("change", (e) => {
  blockedFold = e.target.checked;
  pageState.blocked = 1;
  loadBlocked();
});
$("#blk-search").addEventListener("input", (e) => {
  blockedFilter = e.target.value;
  pageState.blocked = 1;
  loadBlocked();
});

createIfacePicker($("#set-ifaces-btn"));
createIfacePicker($("#iface-badge"), { instant: true });

async function loadInterfaces() {
  try {
    const res = await fetch("/api/interfaces");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    ifaceList = data.interfaces || [];
    ifaceSelected = new Set(data.selected || []);
    renderIfaceButton();
  } catch (err) {
    $("#set-ifaces-text").textContent = t("set.ifaces.fail") + err.message;
  }
}

function selectedIfaces() {
  return ifaceList.filter((i) => ifaceSelected.has(i.name)).map((i) => i.name).join(",");
}

async function loadSettings() {
  fillClientSettings();
  loadAuthState();
  loadCredentials();
  loadInterfaces();
  loadListen();
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    for (const [sel, key] of Object.entries(SERVER_FIELDS)) {
      const el = $(sel);
      if (el.type === "checkbox") el.checked = Boolean(data.values[key]);
      else el.value = data.values[key];
    }
  } catch (err) {
    setStatus(t("err.backend") + err.message, true);
  }
}

async function saveServerSettings(patch) {
  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    for (const [sel, key] of Object.entries(SERVER_FIELDS)) {
      const el = $(sel);
      if (el.type === "checkbox") el.checked = Boolean(data.values[key]);
      else el.value = data.values[key];
    }
    setStatus(t(data.persisted ? "set.saved" : "set.saved.mem"), !data.persisted);
    loadInterfaces();
  } catch (err) {
    setStatus(t("set.savefail") + err.message, true);
  }
}

async function savePassword(next, current) {
  try {
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new: next, current }),
    });
    if (res.status === 403) { setAuthStatus(t("set.pw.wrong"), true); return; }
    if (!res.ok) throw await apiError(res);
    $("#set-pw-new").value = "";
    $("#set-pw-current").value = "";
    setAuthStatus(t(next ? "set.pw.saved" : "set.pw.removed"));
    loadAuthState();
  } catch (err) {
    setAuthStatus(t("set.savefail") + err.message, true);
  }
}

function initSettingsView() {
  $("#set-lang").addEventListener("change", (e) => applyLang(e.target.value));
  $("#set-theme").addEventListener("change", (e) => {
    const value = e.target.value;
    applyTheme(value === "system" ? null : value);
    if (value === "system") localStorage.removeItem("statedash-theme");
    else localStorage.setItem("statedash-theme", value);
    mainChart.redraw();
    histoChart.redraw();
    redrawHistoryCharts();
    render();
  });
  $("#set-units").addEventListener("change", (e) => {
    rateUnitSelect.value = e.target.value;
    rateUnitSelect.dispatchEvent(new Event("change"));
  });
  $("#set-chart").addEventListener("change", (e) => {
    localStorage.setItem("statedash-charts", e.target.checked ? "1" : "0");
    applyCharts();
  });
  $("#set-timefmt").addEventListener("change", (e) => {
    timeFormat = e.target.value;
    localStorage.setItem("statedash-time-format", timeFormat);
    render();                       // the table and charts pick up the new format
    mainChart.redraw();
    histoChart.redraw();
    redrawHistoryCharts();
    if (state.wgList) renderWg(state.wgList);
  });
  $("#set-kill-confirm").addEventListener("change", (e) => {
    killConfirm = e.target.checked;
    localStorage.setItem("statedash-kill-confirm", killConfirm ? "1" : "0");
  });
  $("#set-nav").addEventListener("change", (e) => {
    localStorage.setItem("statedash-nav-collapsed", e.target.checked ? "1" : "0");
    applyNavCollapsed(e.target.checked);
  });

  $("#set-save").addEventListener("click", () => {
    const patch = {};
    for (const [sel, key] of Object.entries(SERVER_FIELDS)) {
      const el = $(sel);
      patch[key] = el.type === "checkbox" ? el.checked : el.value;
    }
    const ifaces = selectedIfaces();
    if (ifaces) patch.ifaces = ifaces;  // with no boxes ticked the setting is left alone
    saveServerSettings(patch);
  });
  $("#set-defaults").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error(res.status);
      await loadSettings();
      setStatus(t("set.saved"));
    } catch (err) {
      setStatus(t("set.savefail") + err.message, true);
    }
  });

  $("#set-listen-select").addEventListener("change", async (event) => {
    try {
      const res = await fetch("/api/listen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: event.target.value }),
      });
      if (!res.ok) throw await apiError(res);
      loadListen();
    } catch (err) {
      setAuthStatus(t("set.savefail") + err.message, true);
      loadListen();
    }
  });

  $("#set-pw-save").addEventListener("click", async () => {
    const next = $("#set-pw-new").value;
    if (!next) { setAuthStatus(t("set.pw.need"), true); return; }
    if (next.length < 6) { setAuthStatus(t("set.pw.short"), true); return; }
    await savePassword(next, $("#set-pw-current").value);
  });
  $("#set-pw-off").addEventListener("click", () => savePassword("", $("#set-pw-current").value));
  $("#set-logout").addEventListener("click", logout);

  $("#set-cred-save").addEventListener("click", async () => {
    const key = $("#set-key").value.trim();
    const secret = $("#set-secret").value.trim();
    const status = $("#set-cred-status");
    if ((key && !secret) || (secret && !key)) {  // key and secret only come as a pair
      status.textContent = t("set.cred.need");
      status.style.color = "var(--critical)";
      return;
    }
    status.style.color = "";
    status.textContent = t("set.cred.checking");
    try {
      const res = await fetch("/api/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, secret, url: $("#set-url").value.trim(), tls_verify: $("#set-tls").checked }),
      });
      if (!res.ok) throw await apiError(res);
      $("#set-key").value = "";
      $("#set-secret").value = "";
      status.style.color = "";
      status.textContent = t("set.cred.applied");
      loadCredentials();
    } catch (err) {
      status.style.color = "var(--critical)";
      status.textContent = t("set.savefail") + err.message;
    }
  });

  $("#set-reset-cols").addEventListener("click", () => {
    for (const key of ["statedash-col-widths", "statedash-col-order", "statedash-host-hidden",
                       "statedash-conn-widths", "statedash-conn-order", "statedash-conn-hidden",
                       "statedash-wg-hidden", "statedash-sort", "statedash-conn-sort",
                       "statedash-blk-widths"]) {
      localStorage.removeItem(key);
    }
    location.reload();
  });
  $("#set-reset-all").addEventListener("click", () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("statedash-")) localStorage.removeItem(key);
    }
    location.reload();
  });
}

for (const item of document.querySelectorAll(".side-item")) {
  if (!item.dataset.view) continue; // the collapse button is not a menu item
  item.addEventListener("click", (event) => {
    event.preventDefault();
    switchView(item.dataset.view);
  });
}
initSettingsView();
const wantView = urlParams.get("view");
if (["wg", "settings", "rules", "blocked"].includes(wantView)) switchView(wantView);

// The menu entry starts hidden and only appears once the log turns out to be
// readable, so it has to be probed once at start — otherwise nothing would ever
// call loadBlocked() and the section could never be reached.
loadBlocked();

/* ---------- collapsing the side menu ---------- */

const collapseBtn = $("#side-collapse");

function applyNavCollapsed(collapsed) {
  document.body.classList.toggle("nav-collapsed", collapsed);
  collapseBtn.title = t(collapsed ? "nav.expand.title" : "nav.collapse.title");
  // once the width animation ends, redraw the charts for the new size
  setTimeout(() => { mainChart.redraw(); histoChart.redraw(); redrawHistoryCharts(); }, 180);
}

collapseBtn.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("nav-collapsed");
  localStorage.setItem("statedash-nav-collapsed", collapsed ? "1" : "0");
  applyNavCollapsed(collapsed);
});
if (localStorage.getItem("statedash-nav-collapsed") === "1") applyNavCollapsed(true);

const hideFwBox = $("#conn-hide-fw");
hideFwBox.checked = hideFirewallConns;
hideFwBox.addEventListener("change", () => {
  hideFirewallConns = hideFwBox.checked;
  localStorage.setItem("statedash-hide-fw", hideFirewallConns ? "1" : "0");
  pageState.conns = 1;
  if (state.connList) renderConnections($("#conn-holder"), state.connList);
});

const hideLocalBox = $("#conn-hide-local");
hideLocalBox.checked = hideLocalConns;
hideLocalBox.addEventListener("change", () => {
  hideLocalConns = hideLocalBox.checked;
  localStorage.setItem("statedash-hide-local", hideLocalConns ? "1" : "0");
  pageState.conns = 1;
  if (state.connList) renderConnections($("#conn-holder"), state.connList);
});

const cfgKindSelect = $("#cfg-kind");
cfgKindSelect.value = cfgKind;
cfgKindSelect.addEventListener("change", () => {
  cfgKind = cfgKindSelect.value === "snat" ? "snat" : "filter";
  localStorage.setItem("statedash-cfg-kind", cfgKind);
  renderRuleConfig();
});
const cfgAutoBox = $("#cfg-hide-auto");
cfgAutoBox.checked = cfgHideAuto;
cfgAutoBox.addEventListener("change", () => {
  cfgHideAuto = cfgAutoBox.checked;
  localStorage.setItem("statedash-cfg-hideauto", cfgHideAuto ? "1" : "0");
  renderRuleConfig();
});

$("#rules-search").addEventListener("input", renderRules);

$("#detail-close").addEventListener("click", closeDetail);
$("#detail-tabs").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab");
  if (btn) switchTab(btn.dataset.tab);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.selectedIp) closeDetail();
});

const rateUnitSelect = $("#rate-unit");

function applyRateUnitLabels() {
  // The unit rides in the header rather than in every cell: repeated in the
  // cells it breaks the right alignment the numeric columns exist for, since
  // figures then end at different places depending on the label. Spelling it
  // out here used to truncate the label, which is why the columns below carry
  // a measured width.
  const unit = rateUnitShort();
  for (const key of ["down", "up", "peakdown", "peakup"]) {
    const th = $(`th[data-sort="${key}"]`);
    if (!th) continue;
    const label = th.querySelector(".th-label");
    label.textContent = t("col." + key);
    th.title = `${t("col." + key)} [${unit}]`;
    let unitEl = label.nextElementSibling;
    if (!unitEl || !unitEl.classList.contains("th-unit")) {
      unitEl = Object.assign(document.createElement("span"), { className: "th-unit" });
      label.after(unitEl);
    }
    unitEl.textContent = "\u00a0" + unit;
  }
}

rateUnitSelect.value = rateUnit;
applyRateUnitLabels();
rateUnitSelect.addEventListener("change", () => {
  rateUnit = rateUnitSelect.value === "kbyte" ? "kbyte" : "kbit";
  localStorage.setItem("statedash-rate-unit", rateUnit);
  applyRateUnitLabels();
  renderTable(true);
});

$("#search").addEventListener("input", (event) => {
  state.filter = event.target.value.trim();
  pageState.hosts = 1;
  renderTable();
});

$("#hosts-table").querySelector("thead").addEventListener("click", (event) => {
  const th = event.target.closest("th.sortable");
  if (!th) return;
  const key = th.dataset.sort;
  if (state.sort.key === key) {
    state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
  } else {
    // text columns default to ascending, numeric ones to descending
    state.sort = { key, dir: ["name", "ip", "mac"].includes(key) ? "asc" : "desc" };
  }
  localStorage.setItem("statedash-sort", JSON.stringify(state.sort));
  pageState.hosts = 1;
  updateSortIndicators();
  renderTable(true); // an explicit sort change reorders at once, even under the cursor
});

const tableWrap = $(".table-wrap");
tableWrap.addEventListener("mouseenter", () => { state.tableHover = true; });
tableWrap.addEventListener("mouseleave", () => {
  state.tableHover = false;
  renderTable(); // the cursor left — the order can be restored
});

/* ---------- column resizing by dragging ---------- */

/* ---------- shared column width mechanics (all tables) ---------- */

// column key: data-col for hosts and WireGuard, data-ck for connections
function colKey(th) {
  return th.dataset.col || th.dataset.ck || "";
}

function applyColumnWidths(table, widths, hidden) {
  const cols = table.querySelectorAll("colgroup col");
  Array.from(table.tHead.rows[0].cells).forEach((th, i) => {
    const key = colKey(th);
    const isFiller = !key || key === "filler";
    const width = isFiller ? 0 : widths[key];
    if (cols[i]) {
      cols[i].style.width = width ? width + "px" : "";
      if (hidden) cols[i].style.display = hidden.has(key) ? "none" : "";
    }
    th.style.width = width ? width + "px" : "";
    if (hidden) th.style.display = hidden.has(key) ? "none" : "";
  });
}

/** Attaches resize grips to every header of the table. */
function installColumnResizers(table, { widths, storageKey, onChange }) {
  for (const th of Array.from(table.tHead.rows[0].cells)) {
    const key = colKey(th);
    if (!key || key === "filler" || th.querySelector(".col-resizer")) continue;
    const grip = document.createElement("span");
    grip.className = "col-resizer";
    grip.title = t("grip.title");
    th.appendChild(grip);

    grip.addEventListener("click", (event) => event.stopPropagation());
    grip.addEventListener("dragstart", (event) => event.preventDefault());  // drag the width, not the column
    grip.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      for (const name of Object.keys(widths)) delete widths[name];
      localStorage.removeItem(storageKey);
      onChange();
    });
    grip.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // freeze the current widths of all columns, then move only this one
      for (const other of Array.from(table.tHead.rows[0].cells)) {
        const otherKey = colKey(other);
        if (otherKey && otherKey !== "filler") {
          widths[otherKey] = Math.round(other.getBoundingClientRect().width);
        }
      }
      const startX = event.clientX;
      const startW = widths[key];
      grip.classList.add("dragging");
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      const onMove = (ev) => {
        widths[key] = Math.max(56, startW + ev.clientX - startX);
        onChange();
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        grip.classList.remove("dragging");
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        localStorage.setItem(storageKey, JSON.stringify(widths));
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }
}

/* ---------- showing and hiding columns (shared mechanics) ---------- */

function loadHiddenSet(storageKey, validKeys) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) return new Set(saved.filter((k) => validKeys.includes(k)));
  } catch { /* дефолт — всё видно */ }
  return new Set();
}

function makeColumnPicker(button, defs, storageKey, hiddenSet, onChange) {
  const pop = document.createElement("div");
  pop.className = "col-picker";
  pop.hidden = true;
  vizRoot.appendChild(pop); // inside .viz-root so the theme variables apply
  function rebuild() {
    pop.innerHTML = "";
    for (const def of defs) {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !hiddenSet.has(def.key);
      // the last visible column cannot be hidden
      cb.disabled = cb.checked && defs.length - hiddenSet.size <= 1;
      cb.addEventListener("change", () => {
        if (cb.checked) hiddenSet.delete(def.key); else hiddenSet.add(def.key);
        localStorage.setItem(storageKey, JSON.stringify([...hiddenSet]));
        rebuild();
        onChange();
      });
      label.append(cb, t(def.label)); // def.label is a localisation key
      pop.appendChild(label);
    }
  }
  pop.addEventListener("click", (event) => event.stopPropagation());
  columnPickers.push({ rebuild: () => { if (!pop.hidden) rebuild(); } });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (pop.hidden) {
      rebuild();
      const rect = button.getBoundingClientRect();
      pop.style.top = rect.bottom + 4 + "px";
      pop.style.left = Math.max(rect.right - 220, 8) + "px";
      pop.hidden = false;
    } else {
      pop.hidden = true;
    }
  });
  document.addEventListener("click", (event) => {
    if (!pop.hidden && !pop.contains(event.target) && event.target !== button) pop.hidden = true;
  });
}

// Data columns have fixed widths (px); the last empty filler column takes
// the rest of the window.
// Widths and order are bound to the column name (data-col), not to its position.
const hostsTable = $("#hosts-table");
const tableCols = Array.from(hostsTable.querySelectorAll("colgroup col"));
const MIN_COL_PX = 56;

const CELL_SEL = {
  name: ".col-host", down: ".down", up: ".up", conns: ".conns", ip: ".ip",
  mac: ".mac", addr: ".addr", start: ".start", uptime: ".uptime", idle: ".idle",
  iface: ".iface", vendor: ".vendor", peer: ".peer", dests: ".dests",
  peakdown: ".peakdown", peakup: ".peakup",
  spark: ".col-spark", tdown: ".tdown", tup: ".tup",
};
const DEFAULT_ORDER = Object.keys(CELL_SEL);
// values are localisation keys, translated at render time
const HOST_COL_LABELS = {
  name: "col.name", down: "col.down", up: "col.up", conns: "col.conns",
  ip: "col.ip", mac: "col.mac", addr: "col.addr", start: "col.start",
  uptime: "col.uptime", idle: "col.idle", iface: "col.iface", vendor: "col.vendor",
  peer: "col.peer", dests: "col.dests", peakdown: "col.peakdown", peakup: "col.peakup",
  spark: "col.spark", tdown: "col.tdown", tup: "col.tup",
};
// everything outside the default set is hidden initially
const HOST_HIDDEN_DEFAULT = ["iface", "vendor", "peer", "dests", "peakdown", "peakup"];
let hostHiddenCols = loadHiddenSet("statedash-host-hidden", DEFAULT_ORDER);
if (!localStorage.getItem("statedash-host-hidden")) hostHiddenCols = new Set(HOST_HIDDEN_DEFAULT);

// Rate columns carry a unit as well as a figure, and under table-layout: fixed
// an unset width leaves them too narrow for both. Everything else still sizes
// itself; a width the user drags overrides these.
// Measured against the longest case — Russian labels with "Кбит/с" — plus room
// for the sort arrow and the resize grip. English needs less and simply gets a
// roomier column.
const RATE_COL_W = { down: 128, up: 150, peakdown: 164, peakup: 178 };
const colWidths = { ...RATE_COL_W };   // {key: px}
let colOrder = DEFAULT_ORDER.slice();
try {
  const savedW = JSON.parse(localStorage.getItem("statedash-col-widths"));
  if (savedW && typeof savedW === "object") Object.assign(colWidths, savedW);
  const savedO = JSON.parse(localStorage.getItem("statedash-col-order"));
  // apply only when the set of columns matches (it may have changed)
  if (Array.isArray(savedO) && savedO.length === DEFAULT_ORDER.length
      && DEFAULT_ORDER.every((k) => savedO.includes(k))) colOrder = savedO;
} catch { /* битые значения — остаёмся на дефолтах */ }
localStorage.removeItem("statedash-cols-px");

function headThs() {
  return Array.from(hostsTable.tHead.rows[0].cells);
}

function applyColWidths() {
  applyColumnWidths(hostsTable, colWidths, hostHiddenCols);
  invalidateSparkBox();  // the sparkline column may have just changed width
}

// Catches what applyColWidths cannot: the window resizing, the browser zooming,
// a font arriving late. The sparkline column has no fixed width, so it stretches
// with the table and its measurement goes stale without anything calling in.
new ResizeObserver(invalidateSparkBox).observe(hostsTable);

function applyOrderToRow(tr) {
  for (const key of colOrder) {
    const cell = tr.querySelector(CELL_SEL[key]);
    cell.style.display = hostHiddenCols.has(key) ? "none" : "";
    tr.appendChild(cell);
  }
  tr.appendChild(tr.querySelector(".filler"));
}

function applyColumnOrder() {
  const headRow = hostsTable.tHead.rows[0];
  for (const key of colOrder) headRow.appendChild(headRow.querySelector(`th[data-col="${key}"]`));
  headRow.appendChild(headRow.querySelector('th[data-col="filler"]'));
  for (const row of state.rows.values()) applyOrderToRow(row.tr);
  applyColWidths();
}

applyColumnOrder();
applyColWidths();
makeColumnPicker(
  $("#hosts-cols-btn"),
  DEFAULT_ORDER.map((k) => ({ key: k, label: HOST_COL_LABELS[k] })),
  "statedash-host-hidden",
  hostHiddenCols,
  applyColumnOrder
);

headThs().forEach((th) => {
  const key = th.dataset.col;

  // dragging a header changes the column order
  th.addEventListener("dragstart", (event) => {
    if (key === "filler") { event.preventDefault(); return; }
    event.dataTransfer.setData("text/plain", key);
    event.dataTransfer.effectAllowed = "move";
  });
  th.addEventListener("dragover", (event) => {
    event.preventDefault();
    th.classList.add("th-dragover");
  });
  th.addEventListener("dragleave", () => th.classList.remove("th-dragover"));
  th.addEventListener("drop", (event) => {
    event.preventDefault();
    th.classList.remove("th-dragover");
    const from = event.dataTransfer.getData("text/plain");
    if (!from || from === key || !colOrder.includes(from)) return;
    colOrder.splice(colOrder.indexOf(from), 1);
    if (key === "filler") colOrder.push(from); // dropped on the empty tail — move to the end
    else colOrder.splice(colOrder.indexOf(key), 0, from);
    localStorage.setItem("statedash-col-order", JSON.stringify(colOrder));
    applyColumnOrder();
  });

});

installColumnResizers(hostsTable, {
  widths: colWidths,
  storageKey: "statedash-col-widths",
  onChange: applyColWidths,
});

installColumnResizers($("#blk-table"), {
  widths: blkWidths,
  storageKey: "statedash-blk-widths",
  onChange: applyBlkWidths,
});
applyBlkWidths();

try {
  const savedSort = JSON.parse(localStorage.getItem("statedash-sort"));
  if (savedSort && savedSort.key && ["asc", "desc"].includes(savedSort.dir)) state.sort = savedSort;
} catch { /* битое значение — остаёмся на сортировке по умолчанию */ }
updateSortIndicators();

const chartToggle = $("#chart-toggle");
const chartWrap = $("#main-chart-wrap");
/**
 * The throughput chart, folded into the Firewall card.
 *
 * It sits under the tiles and opens from the button in that card's head, so one
 * card carries how the machine is doing and how much is going through it. When
 * the Firewall card is not there — an installation without the Lobby: Dashboard
 * privilege has none — the chart moves into a card of its own with the same
 * button, rather than disappearing with the card it was leaning on.
 *
 * The button is always in a card head, never inside what it hides: putting it
 * inside once left the chart with no way back.
 */
function chartsShown() {
  return localStorage.getItem("statedash-charts") !== "0";
}

function chartSlot() {
  const sysCard = $("#sys-card");
  const inFirewall = sysCard && !sysCard.hidden;
  return {
    slot: $(inFirewall ? "#sys-chart-slot" : "#chart-card-slot"),
    button: $(inFirewall ? "#chart-toggle" : "#chart-toggle-alt"),
    ownCard: !inFirewall,
  };
}

function applyCharts() {
  const on = chartsShown();
  const { slot, button, ownCard } = chartSlot();
  const card = $("#chart-card");
  const block = $("#chart-block");

  if (card) card.hidden = !ownCard;
  // the legend and the heading go where the chart goes; they are one block
  if (slot && block && block.parentNode !== slot) slot.appendChild(block);
  if (block) block.hidden = !on;
  // inside the Firewall card the block names itself; in a card of its own the
  // card's own heading already does, and two would be one too many
  const title = $("#chart-block-title");
  if (title) title.hidden = ownCard;

  for (const [el, mine] of [[$("#chart-toggle"), button === $("#chart-toggle")],
                            [$("#chart-toggle-alt"), button === $("#chart-toggle-alt")]]) {
    if (!el) continue;
    el.hidden = !mine;
    el.textContent = t(on ? "chart.hide" : "chart.show");
    el.title = t("chart.toggle.title");
    el.classList.toggle("active", on);
  }

  const checkbox = $("#set-chart");
  if (checkbox) checkbox.checked = on;
  if (on) mainChart.redraw();
}

function toggleCharts() {
  localStorage.setItem("statedash-charts", chartsShown() ? "0" : "1");
  applyCharts();
}
for (const id of ["#chart-toggle", "#chart-toggle-alt"]) {
  const button = $(id);
  if (button) button.addEventListener("click", toggleCharts);
}

// The same control as the chart above, sharing its wording. On a firewall nobody
// is worried about, the tiles are a row of figures that never moves, and the
// traffic below is what the page is for.
const sysToggle = $("#sys-toggle");
const sysTiles = $("#sys-tiles");
function applySysHidden(hidden) {
  sysTiles.hidden = hidden;
  sysToggle.textContent = t(hidden ? "sys.tiles.show" : "sys.tiles.hide");
  localStorage.setItem("statedash-sys-hidden", hidden ? "1" : "0");
}
sysToggle.addEventListener("click", () => applySysHidden(!sysTiles.hidden));
if (localStorage.getItem("statedash-sys-hidden") === "1") applySysHidden(true);

function applyLang(next) {
  lang = next === "en" ? "en" : "ru";
  localStorage.setItem("statedash-lang", lang);
  applyStaticLang();
  applyRateUnitLabels();
  rebuildColumnPickers();
  // redraw everything that is built from data
  render();
  if (state.detailMode === "wg") {
    renderWgDetailHead();
    if (state.tab === "general") renderWgGeneral();
  } else if (state.selectedIp) {
    renderDetailHead();
    if (state.tab === "general") renderGeneral();
  }
  if (state.connList && state.tab === "conns") renderConnections($("#conn-holder"), state.connList);
  if (state.wgList) renderWg(state.wgList);
  if (state.rulesList) renderRules();
  // The tile labels are built here rather than marked up with data-i18n, so
  // without this they keep the old language until the next poll — ten seconds of
  // a page that has half changed.
  if (lastSystem) renderSystem(lastSystem);
  if (!$("#view-settings").hidden) loadSettings();
  applySysHidden(sysTiles.hidden);
  buildRangePicker();
  applyCharts();
  if (historyOpen()) loadHistoryView();
  applyNavCollapsed(document.body.classList.contains("nav-collapsed"));
  mainChart.redraw();
  histoChart.redraw();
  redrawHistoryCharts();
}

const LANGS = [["ru", "Русский"], ["en", "English"]];
const langBtn = $("#lang-btn");
const langMenu = document.createElement("div");
langMenu.className = "lang-menu";
langMenu.hidden = true;
vizRoot.appendChild(langMenu); // inside .viz-root — theme variables apply

function buildLangMenu() {
  langMenu.innerHTML = "";
  for (const [code, label] of LANGS) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = code === lang ? "active" : "";
    const name = document.createElement("span");
    name.textContent = label;
    const check = document.createElement("span");
    check.className = "check";
    check.textContent = code === lang ? "✔" : "";
    item.append(name, check);
    item.addEventListener("click", () => {
      langMenu.hidden = true;
      if (code !== lang) applyLang(code);
    });
    langMenu.appendChild(item);
  }
}

langBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  if (langMenu.hidden) {
    buildLangMenu();
    const rect = langBtn.getBoundingClientRect();
    langMenu.style.top = rect.bottom + 6 + "px";
    langMenu.style.left = Math.max(rect.right - 150, 8) + "px";
    langMenu.hidden = false;
  } else {
    langMenu.hidden = true;
  }
});
document.addEventListener("click", (event) => {
  if (!langMenu.hidden && !langMenu.contains(event.target) && !langBtn.contains(event.target)) {
    langMenu.hidden = true;
  }
});

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  location.href = "/login";
}

$("#logout-btn").addEventListener("click", logout);

// the button only makes sense when a password is set; the settings page keeps its
// own copy in sync through loadAuthState()
fetch("/api/auth/status")
  .then((r) => r.json())
  .then((data) => { $("#logout-btn").hidden = !data.enabled; })
  .catch(() => { /* status unknown — leave the button hidden */ });

$("#theme-btn").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("statedash-theme", next);
  mainChart.redraw();
  histoChart.redraw();
  redrawHistoryCharts();
  render();
  if (lastSystem) renderSystem(lastSystem);  // bar colours come from the theme
});

let fmapResizeTimer = null;
new ResizeObserver(() => {
  mainChart.redraw();
  histoChart.redraw();
  redrawHistoryCharts();
  // the diagram computes its layout from the container width — rebuild it after a resize
  clearTimeout(fmapResizeTimer);
  fmapResizeTimer = setTimeout(() => {
    if (state.rulesList && !$("#view-rules").hidden) renderRules();
  }, 120);
}).observe(document.body);
systemDark.addEventListener("change", () => {
  mainChart.redraw();
  histoChart.redraw();
  redrawHistoryCharts();
  render();
  if (lastSystem) renderSystem(lastSystem);  // bar colours come from the theme
});

applyStaticLang();
applyRateUnitLabels();
applySysHidden(sysTiles.hidden);
buildRangePicker();
applyCharts();
poll();
// Polled from the start rather than when a view is opened: the card sits on
// the page that loads first, and it stays hidden until the answer says the
// privilege is there.
loadSystem();
systemTimer = setInterval(loadSystem, 10000);
