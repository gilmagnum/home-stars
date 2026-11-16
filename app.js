/* כוכבי הבית — אפליקציית משימות ופרסים למשפחה */
(function () {
  'use strict';

  // ---------- הגדרות ושמירה ----------
  var CFG = window.HS_CONFIG || {};
  var SYNC = !!(CFG.supabaseUrl && CFG.supabaseKey);
  var K_STATE = 'hs:state', K_CODE = 'hs:code', K_ME = 'hs:me';
  var LEVEL_PTS = 150;
  var COLORS = ['#1E5BD8', '#1971C2', '#364FC7', '#0F2A5F', '#7C3AED', '#5F3DC4', '#9C36B5', '#C2255C', '#A61E4D', '#E03131', '#D9480F', '#B35C00', '#5C940D', '#2B8A3E', '#087F5B', '#0E7C86', '#495057', '#212529', '#FFD43B', '#FAB005', '#F08C00'];
  var DAY_L = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  var DAY_N = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var RW_ICONS = { tv: 'זמן מסך', food: 'אוכל', moon: 'שעת שינה', heart: 'פינוק', film: 'סרט', ball: 'משחק', gift: 'מתנה', star: 'מיוחד' };

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { toast('האחסון במכשיר מלא'); } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var S = null;
  try { S = JSON.parse(ls.get(K_STATE) || 'null'); } catch (e) { S = null; }
  var code = ls.get(K_CODE);
  var me = ls.get(K_ME);
  var ui = { tab: null, pinFor: null, photoTask: null, sync: SYNC ? 'idle' : 'off' };

  // ---------- כלים ----------
  function now() { return Date.now(); }
  function uid() { return now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ds(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ds(d); }
  function today() { return ds(new Date()); }
  function weekStart(s) { var d = pd(s); d.setDate(d.getDate() - d.getDay()); return ds(d); }
  function dow(s) { return pd(s).getDay(); }
  function genCode() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
    var r = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(r);
    for (var i = 0; i < 16; i++) { out += a[r[i] % a.length]; if (i % 4 === 3 && i < 15) out += '-'; }
    return out;
  }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-'); }

  var IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
    star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
    flame: '<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6h3v12"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    exam: '<path d="M9 3h6v4H9z"/><path d="M16 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2M9 13l2 2 4-4"/>'
  };
  function ic(n, s) {
    s = s || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
  }
  function starIc(s) {
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="#FFC93C" stroke="#E0A400" stroke-width="1.5" aria-hidden="true">' + IC.star + '</svg>';
  }

  // ---------- אווטאר ----------
  var SKINS = ['#FFDBB5', '#F1C27D', '#D89A5B', '#A86B3C', '#6E4325'];
  var HAIRC = ['#2B1B12', '#6B3E1F', '#B5651D', '#E8C547', '#C2255C'];
  var HAIRS = [['none', 'בלי'], ['short', 'קצר'], ['long', 'ארוך'], ['curly', 'מתולתל'], ['bun', 'קוקו']];
  var ITEMS = {
    hat: { t: 'כובעים', list: [['cap', 'כובע מצחייה', 2], ['party', 'כובע מסיבה', 4], ['wizard', 'כובע קוסם', 6], ['crown', 'כתר', 8]] },
    glasses: { t: 'משקפיים', list: [['round', 'משקפיים', 3], ['sun', 'משקפי שמש', 5], ['stars', 'משקפי כוכבים', 9]] },
    extra: { t: 'אביזרים', list: [['bow', 'פפיון', 2], ['phones', 'אוזניות', 7], ['cape', 'גלימת גיבור', 10]] },
    bg: { t: 'רקע', list: [['plain', 'רגיל', 1], ['stars', 'כוכבים', 3], ['rainbow', 'קשת', 6], ['gold', 'מסגרת זהב', 12]] }
  };
  function defAv() { return { skin: 0, hair: 'short', hairC: 0, hat: '', glasses: '', extra: '', bg: 'plain' }; }
  function onColor(hex) {
    var h = String(hex || '#000').replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#13203B' : '#FFFFFF';
  }
  function starPts(cx, cy, R) {
    var p = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  function avatarSvg(m, a) {
    a = a || m.av || defAv();
    var col = m.color || '#1E5BD8', skin = SKINS[a.skin] || SKINS[0], hc = HAIRC[a.hairC] || HAIRC[0], ink = '#13203B', o = '';
    var cid = 'c' + Math.random().toString(36).slice(2, 7);
    o += '<defs><clipPath id="' + cid + '"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#' + cid + ')">';
    o += '<rect width="100" height="100" fill="' + esc(col) + '"/>';
    if (a.bg === 'stars') o += [[16, 20, 5], [84, 18, 4], [12, 62, 3.5], [88, 58, 5], [78, 86, 3]].map(function (s) { return '<polygon points="' + starPts(s[0], s[1], s[2]) + '" fill="#FFF2C7" opacity=".9"/>'; }).join('');
    if (a.bg === 'rainbow') o += ['#E03131', '#F08C00', '#FAB005', '#2B8A3E', '#1971C2'].map(function (c, i) { return '<circle cx="50" cy="104" r="' + (66 - i * 6) + '" fill="none" stroke="' + c + '" stroke-width="6" opacity=".8"/>'; }).join('');
    if (a.extra === 'cape') o += '<path d="M24 74 L12 100 L88 100 L76 74 Z" fill="#E03131"/>';
    if (a.hair === 'long') o += '<path d="M25 50 C25 24 75 24 75 50 L78 84 L22 84 Z" fill="' + hc + '"/>';
    o += '<path d="M20 100 C20 80 34 72 50 72 C66 72 80 80 80 100 Z" fill="#F2F5FB"/>';
    o += '<circle cx="50" cy="48" r="24" fill="' + skin + '"/>';
    if (a.hair === 'short' || a.hair === 'long' || a.hair === 'bun') o += '<path d="M26 46 C25 25 75 25 74 46 C68 37 58 33 50 33 C42 33 32 37 26 46 Z" fill="' + hc + '"/>';
    if (a.hair === 'bun') o += '<circle cx="50" cy="22" r="8" fill="' + hc + '"/>';
    if (a.hair === 'curly') o += [[30, 38], [38, 30], [48, 27], [58, 28], [67, 33], [72, 42], [27, 46]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="7" fill="' + hc + '"/>'; }).join('');
    o += '<circle cx="34" cy="56" r="4" fill="#FF8A8A" opacity=".35"/><circle cx="66" cy="56" r="4" fill="#FF8A8A" opacity=".35"/>';
    o += '<circle cx="41" cy="49" r="3" fill="' + ink + '"/><circle cx="59" cy="49" r="3" fill="' + ink + '"/>';
    o += '<path d="M42 58 Q50 65 58 58" fill="none" stroke="' + ink + '" stroke-width="2.5" stroke-linecap="round"/>';
    if (a.glasses === 'round') o += '<circle cx="41" cy="49" r="7" fill="none" stroke="' + ink + '" stroke-width="2"/><circle cx="59" cy="49" r="7" fill="none" stroke="' + ink + '" stroke-width="2"/><path d="M48 49h4" stroke="' + ink + '" stroke-width="2"/>';
    if (a.glasses === 'sun') o += '<rect x="32" y="44" width="15" height="10" rx="4" fill="' + ink + '"/><rect x="53" y="44" width="15" height="10" rx="4" fill="' + ink + '"/><path d="M47 48h6" stroke="' + ink + '" stroke-width="2"/>';
    if (a.glasses === 'stars') o += '<polygon points="' + starPts(41, 49, 9) + '" fill="#FFC93C" stroke="#E0A400"/><polygon points="' + starPts(59, 49, 9) + '" fill="#FFC93C" stroke="#E0A400"/><circle cx="41" cy="50" r="2.5" fill="' + ink + '"/><circle cx="59" cy="50" r="2.5" fill="' + ink + '"/>';
    if (a.hat === 'cap') o += '<path d="M26 38 C26 20 74 20 74 38 Z" fill="#1E5BD8"/><path d="M50 36 L84 37 C82 41 64 41 50 40 Z" fill="#1747AE"/>';
    if (a.hat === 'party') o += '<path d="M38 32 L50 4 L62 32 Z" fill="#E03131"/><circle cx="50" cy="5" r="4" fill="#FFC93C"/><circle cx="46" cy="22" r="2" fill="#FFF"/><circle cx="54" cy="16" r="2" fill="#FFF"/>';
    if (a.hat === 'wizard') o += '<path d="M30 32 L50 0 L70 32 Z" fill="#5F3DC4"/><ellipse cx="50" cy="32" rx="26" ry="5" fill="#4C2FA0"/><polygon points="' + starPts(50, 18, 5) + '" fill="#FFC93C"/>';
    if (a.hat === 'crown') o += '<polygon points="30,32 33,13 42,23 50,8 58,23 67,13 70,32" fill="#FFC93C" stroke="#E0A400" stroke-width="1.5"/><circle cx="50" cy="26" r="2.5" fill="#E03131"/>';
    if (a.extra === 'phones') o += '<path d="M26 48 C26 18 74 18 74 48" fill="none" stroke="' + ink + '" stroke-width="4"/><rect x="21" y="42" width="9" height="14" rx="4" fill="#E03131"/><rect x="70" y="42" width="9" height="14" rx="4" fill="#E03131"/>';
    if (a.extra === 'bow') o += '<path d="M50 76 L40 70 L40 82 Z M50 76 L60 70 L60 82 Z" fill="#E03131"/><circle cx="50" cy="76" r="2.5" fill="#B02525"/>';
    o += '</g>';
    if (a.bg === 'gold') o += '<circle cx="50" cy="50" r="47" fill="none" stroke="#FFC93C" stroke-width="6"/>';
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' + o + '</svg>';
  }
  function unlocked(kidId) {
    var lv = level(kidId).lv, out = [];
    Object.keys(ITEMS).forEach(function (k) { ITEMS[k].list.forEach(function (it) { if (it[2] > 1 && it[2] <= lv) out.push(it); }); });
    return out;
  }
  function nextUnlock(kidId) {
    var lv = level(kidId).lv, best = null;
    Object.keys(ITEMS).forEach(function (k) { ITEMS[k].list.forEach(function (it) { if (it[2] > lv && (!best || it[2] < best[2])) best = it; }); });
    return best;
  }

  // ---------- מודל נתונים ----------
  function alive(map) { return Object.keys(map || {}).map(function (k) { return map[k]; }).filter(function (x) { return x && !x.del; }); }
  function byCreated(a, b) { return (a.c || 0) - (b.c || 0); }
  function members() { return alive(S.members).sort(byCreated); }
  function kids() { return members().filter(function (m) { return m.role === 'kid'; }); }
  function parents() { return members().filter(function (m) { return m.role === 'parent'; }); }
  function meM() { return S && me ? S.members[me] : null; }
  function touch(o) { o.u = now(); return o; }

  function isDue(t, date) {
    if (t.del) return false;
    if (t.rec === 'once') return t.date === date;
    if (t.from && date < t.from) return false;
    if (t.rec === 'days') return (t.days || []).indexOf(dow(date)) >= 0;
    return true;
  }
  function assigned(t, kidId) { return !t.as || !t.as.length || t.as.indexOf(kidId) >= 0; }
  function dueFor(kidId, date) {
    return alive(S.tasks).filter(function (t) { return assigned(t, kidId) && isDue(t, date); }).sort(byCreated);
  }
  function logId(taskId, kidId, date) { return taskId + '_' + kidId + '_' + date; }
  function logOf(taskId, kidId, date) { var l = S.logs[logId(taskId, kidId, date)]; return l && !l.del ? l : null; }
  function statusOf(t, kidId, date) { var l = logOf(t.id, kidId, date); return l ? l.status : 'todo'; }
  function isDone(st) { return st === 'pending' || st === 'approved'; }
  function ptsOf(t) { return t.duty ? 0 : (+t.points || 0) * (t.bonus ? 2 : 1); }
  function ptsBadge(n) { return n ? '<span class="pts">+' + n + '</span>' : '<span class="pts grey">חובה</span>'; }

  function logs() { return alive(S.logs); }
  function earned(kidId, from, to) {
    return logs().reduce(function (s, l) {
      return s + (l.kidId === kidId && l.status === 'approved' && (!from || l.date >= from) && (!to || l.date <= to) ? (+l.points || 0) : 0);
    }, 0);
  }
  function spent(kidId) {
    return alive(S.reds).reduce(function (s, r) {
      return s + (r.kidId === kidId && (r.status === 'approved' || r.status === 'pending') ? (+r.cost || 0) : 0);
    }, 0);
  }
  function balance(kidId) { return earned(kidId) - spent(kidId); }
  function pendingPts(kidId) {
    return logs().reduce(function (s, l) { return s + (l.kidId === kidId && l.status === 'pending' ? (+l.points || 0) : 0); }, 0);
  }
  function dayState(kidId, date) {
    var due = dueFor(kidId, date);
    if (!due.length) return 'none';
    var n = due.filter(function (t) { return isDone(statusOf(t, kidId, date)); }).length;
    return n === due.length ? 'full' : n > 0 ? 'part' : 'empty';
  }
  function streak(kidId) {
    var k = S.members[kidId], start = k && k.c ? ds(new Date(k.c)) : today();
    var d = today(), count = 0, grace = {};
    if (dayState(kidId, d) !== 'full') d = addDays(d, -1);
    for (var i = 0; i < 400 && d >= start; i++) {
      var st = dayState(kidId, d);
      if (st === 'full') count++;
      else if (st !== 'none') {
        var w = weekStart(d);
        if (grace[w]) break;
        grace[w] = true;
      }
      d = addDays(d, -1);
    }
    return count;
  }
  function level(kidId) {
    var tot = earned(kidId);
    return { lv: Math.floor(tot / LEVEL_PTS) + 1, toNext: LEVEL_PTS - (tot % LEVEL_PTS), pct: Math.round((tot % LEVEL_PTS) / LEVEL_PTS * 100) };
  }
  function familyWeek() {
    var ws = weekStart(today());
    return kids().reduce(function (s, k) { return s + earned(k.id, ws, today()); }, 0);
  }
  function selfCompare(kidId) {
    var t = today(), ws = weekStart(t);
    var cur = earned(kidId, ws, t), last = earned(kidId, addDays(ws, -7), addDays(t, -7));
    return { cur: cur, last: last, pct: last > 0 ? Math.round((cur - last) / last * 100) : null };
  }

  function newState(familyName) {
    var t = now();
    var s = {
      v: 1,
      family: { name: familyName, goalTitle: 'ערב פיצה משפחתי', goalTarget: 800, u: t },
      members: {}, tasks: {}, logs: {}, rewards: {}, reds: {}, exams: {}
    };
    [['30 דק׳ זמן מסך', 100, 'tv'], ['לבחור את ארוחת הערב', 150, 'food'], ['להישאר ער עוד חצי שעה', 200, 'moon'], ['יום כיף עם אבא או אמא', 500, 'heart']]
      .forEach(function (r, i) { var id = uid() + i; s.rewards[id] = { id: id, title: r[0], cost: r[1], icon: r[2], c: t + i, u: t }; });
    var from = today();
    [['לסדר את המיטה', 'home', 0, 'daily', null, true], ['לפנות כלים מהשולחן', 'home', 10, 'daily'], ['שיעורי בית', 'school', 20, 'days', [0, 1, 2, 3, 4]], ['להכין תיק למחר', 'school', 10, 'days', [0, 1, 2, 3, 4]]]
      .forEach(function (x, i) {
        var id = uid() + i;
        s.tasks[id] = { id: id, title: x[0], cat: x[1], points: x[2], rec: x[3], days: x[4] || [], as: [], from: from, duty: !!x[5], needsApproval: !x[5], needsPhoto: false, bonus: false, c: t + i, u: t };
      });
    return s;
  }

  // ---------- שמירה וסנכרון ----------
  function save() { if (S) ls.set(K_STATE, JSON.stringify(S)); }
  var pushTimer = null;
  function commit(msg) {
    save();
    render();
    if (msg) toast(msg);
    if (SYNC && code) { clearTimeout(pushTimer); pushTimer = setTimeout(syncNow, 600); }
  }
  function mergeMaps(a, b) {
    var out = {}, k;
    a = a || {}; b = b || {};
    for (k in a) out[k] = a[k];
    for (k in b) if (!out[k] || (b[k].u || 0) > (out[k].u || 0)) out[k] = b[k];
    return out;
  }
  function merge(a, b) {
    if (!b) return a;
    if (!a) return b;
    return {
      v: 1,
      family: (b.family.u || 0) > (a.family.u || 0) ? b.family : a.family,
      members: mergeMaps(a.members, b.members), tasks: mergeMaps(a.tasks, b.tasks), logs: mergeMaps(a.logs, b.logs),
      rewards: mergeMaps(a.rewards, b.rewards), reds: mergeMaps(a.reds, b.reds), exams: mergeMaps(a.exams, b.exams)
    };
  }
  function rpc(fn, body) {
    return fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) { return t ? JSON.parse(t) : null; });
  }
  var syncing = false, again = false;
  function syncNow() {
    if (!SYNC || !code || !S) return Promise.resolve();
    if (syncing) { again = true; return Promise.resolve(); }
    syncing = true; ui.sync = 'busy';
    var before = JSON.stringify(S);
    return rpc('hs_get', { p_code: code }).then(function (remote) {
      var merged = merge(S, remote);
      var changedRemote = !remote || JSON.stringify(merged) !== JSON.stringify(remote);
      S = merged; save();
      return changedRemote ? rpc('hs_put', { p_code: code, p_data: S }) : null;
    }).then(function () {
      ui.sync = 'ok'; ui.syncAt = now();
    }).catch(function () {
      ui.sync = 'err';
    }).then(function () {
      syncing = false;
      if (JSON.stringify(S) !== before) softRender();
      if (again) { again = false; syncNow(); }
    });
  }
  function softRender() {
    var a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && document.getElementById('app').contains(a)) return;
    render();
  }
  if (SYNC) {
    setInterval(function () { if (document.visibilityState === 'visible') syncNow(); }, 20000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') syncNow(); });
  }

  // ---------- ממשק כללי ----------
  var toastT = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function openModal(html) {
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="sheet-bg" data-act="closeModal"></div><div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    var f = m.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea');
    if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function closeModal() { document.getElementById('modal').innerHTML = ''; }
  function av(m, size) {
    if (m.role === 'kid') return '<div class="av ' + (size || 'm') + '" style="background:' + esc(m.color || '#1E5BD8') + '">' + avatarSvg(m) + '</div>';
    return '<div class="av ' + (size || 'm') + '" style="background:' + esc(m.color || '#0F2A5F') + ';color:' + onColor(m.color || '#0F2A5F') + '">' + esc((m.name || '?').trim().charAt(0)) + '</div>';
  }
  function greet() { var h = new Date().getHours(); return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב'; }
  function nav(items) {
    return '<nav class="nav" aria-label="ניווט"><div class="nav-in">' + items.map(function (it) {
      return '<button data-act="tab" data-id="' + it[0] + '"' + (ui.tab === it[0] ? ' aria-current="page"' : '') + '>' + ic(it[1], 24) + '<span>' + it[2] + '</span>' + (it[3] ? '<b class="cnt">' + it[3] + '</b>' : '') + '</button>';
    }).join('') + '</div></nav>';
  }
  function bar(pct, cls) { return '<div class="bar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>'; }

  // ---------- מסכי פתיחה ----------
  function vSetup() {
    var q = new URLSearchParams(location.search).get('f') || '';
    return '<div class="center">' +
      '<div class="brand"><div class="brand-mark">' + starIc(44) + '</div><h1>כוכבי הבית</h1><p class="muted" style="margin:0">משימות, נקודות ופרסים לכל המשפחה</p></div>' +
      '<section class="card shadow"><h2 style="font-size:18px">משפחה חדשה</h2>' +
      '<form data-form="create">' +
      '<div class="field"><label for="f-fam">שם המשפחה</label><input class="inp" id="f-fam" name="fam" required maxlength="40" placeholder="למשל: משפחת כהן"></div>' +
      '<div class="field"><label for="f-pn">השם שלך</label><input class="inp" id="f-pn" name="pname" required maxlength="20" placeholder="למשל: אבא"></div>' +
      '<div class="field"><label for="f-pin">קוד הורה (4 ספרות)</label><input class="inp pin" id="f-pin" name="pin" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off"><span class="hint">הקוד מגן על מסכי ההורים מפני הילדים</span></div>' +
      '<button class="btn block" type="submit">יצירת משפחה</button></form></section>' +
      (SYNC
        ? '<section class="card"><h2 style="font-size:18px">כבר יש משפחה?</h2><form data-form="join"><div class="field"><label for="f-code">קוד משפחה</label><input class="inp" id="f-code" name="code" required dir="ltr" value="' + esc(normCode(q)) + '" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off"></div><button class="btn ghost block" type="submit">הצטרפות</button></form></section>'
        : '<div class="note info">' + ic('cloud') + '<span>מצב מקומי: הנתונים נשמרים במכשיר הזה בלבד. כדי לסנכרן בין הטלפונים של המשפחה צריך לחבר Supabase.</span></div>') +
      '</div>';
  }
  function vPicker() {
    var list = members();
    var sel = ui.pinFor ? S.members[ui.pinFor] : null;
    return '<div class="center">' +
      '<div class="brand"><div class="brand-mark">' + starIc(44) + '</div><h1>' + esc(S.family.name) + '</h1><p class="muted" style="margin:0">מי משתמש עכשיו?</p></div>' +
      '<div class="people">' + list.map(function (m) {
        return '<button class="person" data-act="pick" data-id="' + m.id + '" aria-pressed="' + (ui.pinFor === m.id) + '">' + av(m, 'l') + '<span>' + esc(m.name) + '</span><span class="role">' + (m.role === 'parent' ? 'הורה' : 'ילד/ה') + '</span></button>';
      }).join('') + '</div>' +
      (sel ? '<form data-form="pin" class="card"><div class="field"><label for="f-pin2">הקוד של ' + esc(sel.name) + '</label><input class="inp pin" id="f-pin2" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required autofocus></div><button class="btn block" type="submit">כניסה</button></form>' : '') +
      '</div>';
  }

  // ---------- מסכי ילד ----------
  function kidHero(k) {
    var lv = level(k.id), stv = streak(k.id);
    return '<header class="hero"><div class="hero-row">' + av(k) +
      '<div class="hero-txt"><span class="hero-title">' + greet() + ', ' + esc(k.name) + '</span><span class="hero-sub">יום ' + DAY_N[dow(today())] + '</span></div>' +
      '<div class="balance">' + starIc(18) + '<span>' + balance(k.id) + '</span></div>' +
      '<button class="iconbtn" data-act="logout" aria-label="החלפת משתמש">' + ic('logout') + '</button></div>' +
      '<div class="chips">' + (stv ? '<span class="chip">' + ic('flame', 16) + 'רצף ' + stv + ' ימים</span>' : '') +
      '<span class="chip">' + ic('trophy', 16) + 'שלב ' + lv.lv + ' · עוד ' + lv.toNext + ' לשלב הבא</span></div></header>';
  }
  function taskRow(t, kidId, date) {
    var l = logOf(t.id, kidId, date), st = l ? l.status : 'todo';
    var left, sub, subCls = '';
    if (st === 'approved') { left = '<span class="st ok"><i>' + ic('check', 18) + '</i></span>'; sub = 'אושר'; }
    else if (st === 'pending') { left = '<button class="st wait" data-act="untick" data-id="' + t.id + '" aria-label="ביטול: ' + esc(t.title) + '"><i>' + ic('clock', 18) + '</i></button>'; sub = 'ממתין לאישור הורה'; subCls = 'warn'; }
    else {
      left = '<button class="tick" data-act="tick" data-id="' + t.id + '" aria-label="סיימתי: ' + esc(t.title) + '"><span></span></button>';
      if (st === 'rejected') { sub = 'הוחזר' + (l.note ? ': ' + l.note : '') + ' · אפשר לנסות שוב'; subCls = 'bad'; }
      else sub = (t.note ? t.note + ' · ' : '') + (t.needsPhoto ? 'צריך לצלם' : (t.cat === 'school' ? 'בית ספר' : 'בבית'));
    }
    return '<div class="task' + (isDone(st) ? ' done' : '') + '">' + left +
      '<div class="txt"><span class="ttl">' + esc(t.title) + '</span><span class="sub ' + subCls + '">' + (t.needsPhoto && !isDone(st) ? ic('camera', 14).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-2px"') + ' ' : '') + esc(sub) + '</span></div>' +
      ptsBadge(ptsOf(t)) + '</div>';
  }
  function vKidToday(k) {
    var d = today(), due = dueFor(k.id, d);
    var bonus = due.filter(function (t) { return t.bonus; });
    var home = due.filter(function (t) { return !t.bonus && t.cat !== 'school'; });
    var school = due.filter(function (t) { return !t.bonus && t.cat === 'school'; });
    var doneN = due.filter(function (t) { return isDone(statusOf(t, k.id, d)); }).length;
    var fw = familyWeek(), tg = +S.family.goalTarget || 1;
    var html = kidHero(k) + '<div class="main tight-top"><section class="card shadow overlap">' +
      '<div class="between"><span class="b">התקדמות היום</span><span class="muted">' + doneN + ' מתוך ' + due.length + '</span></div>' + bar(due.length ? doneN / due.length * 100 : 0) +
      '<div class="between"><span class="small b">יעד משפחתי: ' + esc(S.family.goalTitle) + '</span><span class="muted">' + fw + '/' + tg + '</span></div>' + bar(fw / tg * 100, 'y') + '</section>';
    if (due.length && doneN === due.length) html += '<div class="celebrate">כל המשימות של היום בוצעו. כל הכבוד!</div>';
    var lvNow = level(k.id).lv;
    if (lvNow > (k.seenLv || 1)) {
      var nu = unlocked(k.id).filter(function (it) { return it[2] > (k.seenLv || 1); }).map(function (it) { return it[1]; });
      html += '<button class="unlock" data-act="tab" data-id="me">' + starIc(28) + '<span><b>עלית לשלב ' + lvNow + '!</b>' + (nu.length ? ' נפתח: ' + esc(nu.join(', ')) : '') + '. לחצו להלביש את הדמות</span></button>';
    }
    if (k.remind && doneN < due.length) {
      var hm = new Date().getHours() * 60 + new Date().getMinutes(), rp = k.remind.split(':');
      if (hm >= (+rp[0]) * 60 + (+rp[1])) html += '<div class="note wait">' + ic('bell') + '<span>כבר אחרי ' + esc(k.remind) + ' ונשארו ' + (due.length - doneN) + ' משימות להיום</span></div>';
    }
    alive(S.exams).filter(function (e) { return e.kidId === k.id && e.date >= d && e.date <= addDays(d, 7); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e) {
      var left = Math.round((pd(e.date) - pd(d)) / 864e5);
      html += '<div class="note info">' + ic('exam') + '<span><b>מבחן ב' + esc(e.subject) + '</b> · ' + (left === 0 ? 'היום! בהצלחה' : left === 1 ? 'מחר' : 'בעוד ' + left + ' ימים (יום ' + DAY_N[dow(e.date)] + ')') + '</span></div>';
    });
    bonus.forEach(function (t) {
      var st = statusOf(t, k.id, d);
      html += '<section class="bonus"><div class="bonus-ic">' + ic('sparkle', 24) + '</div><div class="txt" style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="lbl">משימת הפתעה · נקודות כפולות</span><span style="font-weight:500">' + esc(t.title) + '</span></div>' +
        (isDone(st) ? '<span class="pts grey">' + (st === 'approved' ? 'אושר' : 'ממתין') + '</span>' : '<button class="btn y sm" data-act="tick" data-id="' + t.id + '">+' + ptsOf(t) + '</button>') + '</section>';
    });
    if (!due.length) html += '<div class="empty">אין משימות להיום. יום חופשי!</div>';
    if (home.length) html += '<h2 class="sec-title">' + ic('home') + 'בבית</h2><div class="list">' + home.map(function (t) { return taskRow(t, k.id, d); }).join('') + '</div>';
    if (school.length) html += '<h2 class="sec-title">' + ic('book') + 'בית ספר</h2><div class="list">' + school.map(function (t) { return taskRow(t, k.id, d); }).join('') + '</div>';
    var pp = pendingPts(k.id);
    if (pp) html += '<p class="muted" style="text-align:center;margin:0">עוד ' + pp + ' נקודות מחכות לאישור</p>';
    return html + '</div>';
  }
  function vKidRewards(k) {
    var bal = balance(k.id);
    var mine = alive(S.reds).filter(function (r) { return r.kidId === k.id; }).sort(function (a, b) { return b.c - a.c; }).slice(0, 4);
    var rw = alive(S.rewards).sort(function (a, b) { return a.cost - b.cost; });
    var html = '<div class="main"><div class="between" style="align-items:center;padding-top:calc(env(safe-area-inset-top) + 8px)"><h1 style="font-size:26px">חנות הפרסים</h1><div class="balance" style="background:var(--navy);color:#fff">' + starIc(18) + '<span>' + bal + ' נק׳</span></div></div>';
    mine.forEach(function (r) {
      var cls = r.status === 'pending' ? 'wait' : r.status === 'approved' ? 'ok' : 'bad';
      var txt = r.status === 'pending' ? 'ממתין לאישור הורה' : r.status === 'approved' ? 'אושר, תהנו!' : 'לא אושר הפעם, הנקודות חזרו';
      html += '<div class="note ' + cls + '">' + ic(r.status === 'pending' ? 'clock' : r.status === 'approved' ? 'check' : 'x') + '<span><b>' + esc(r.title) + '</b> · ' + txt + '</span></div>';
    });
    if (!rw.length) html += '<div class="empty">עוד אין פרסים. בקשו מאבא או אמא להוסיף.</div>';
    html += '<div class="grid2">' + rw.map(function (r) {
      var can = bal >= r.cost;
      return '<div class="reward' + (can ? '' : ' locked') + '"><div class="rw-ic">' + ic(r.icon || 'gift', 26) + '</div><div class="ttl">' + esc(r.title) + '</div><div class="muted">' + r.cost + ' נק׳</div>' +
        (can ? '<button class="btn" data-act="redeem" data-id="' + r.id + '">לממש</button>'
          : bar(bal / r.cost * 100, 'y') + '<button class="btn dash" disabled>' + ic('lock', 16) + 'עוד ' + (r.cost - bal) + '</button>') + '</div>';
    }).join('') + '</div></div>';
    return html;
  }
  function vKidMe(k) {
    var a = k.av || defAv(), lv = level(k.id), nx = nextUnlock(k.id);
    var html = '<div class="main"><div class="me-head"><div class="av xl" style="background:' + esc(k.color) + '">' + avatarSvg(k) + '</div>' +
      '<h1 style="font-size:24px">' + esc(k.name) + '</h1><span class="chip" style="background:var(--blue)">' + ic('trophy', 16) + 'שלב ' + lv.lv + '</span>' +
      '<div style="width:100%">' + bar(lv.pct, 'y big') + '</div><span class="muted">' + (nx ? 'עוד ' + lv.toNext + ' נקודות לשלב הבא · בשלב ' + nx[2] + ' נפתח: ' + esc(nx[1]) : 'פתחת את כל הפריטים!') + '</span></div>';
    function choice(key, val, label, lvReq, sw) {
      var on = String(a[key]) === String(val), lock = lvReq && lvReq > lv.lv;
      return '<button class="choice' + (sw ? ' sw' : '') + '" data-act="avSet" data-k="' + key + '" data-v="' + val + '" aria-pressed="' + on + '"' + (lock ? ' disabled' : '') + (sw ? ' style="background:' + sw + '" aria-label="' + label + '"' : '') + '>' + (sw ? '' : (lock ? ic('lock', 14) + ' שלב ' + lvReq : esc(label))) + '</button>';
    }
    html += '<section class="card"><span class="lbl">צבע עור</span><div class="choices">' + SKINS.map(function (c, i) { return choice('skin', i, 'גוון ' + (i + 1), 0, c); }).join('') + '</div>' +
      '<span class="lbl">תסרוקת</span><div class="choices">' + HAIRS.map(function (h) { return choice('hair', h[0], h[1], 0); }).join('') + '</div>' +
      '<span class="lbl">צבע שיער</span><div class="choices">' + HAIRC.map(function (c, i) { return choice('hairC', i, 'צבע שיער ' + (i + 1), 0, c); }).join('') + '</div></section>';
    Object.keys(ITEMS).forEach(function (key) {
      var g = ITEMS[key];
      html += '<section class="card"><span class="lbl">' + g.t + '</span><div class="choices">' + (key === 'bg' ? '' : choice(key, '', 'בלי', 0)) +
        g.list.map(function (it) { return choice(key, it[0], it[1], it[2]); }).join('') + '</div></section>';
    });
    html += '<section class="card"><span class="lbl">' + ic('bell', 16).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-3px"') + ' תזכורת יומית</span>' +
      '<form data-form="remind" class="row" style="flex-direction:row;gap:10px"><input class="inp" type="time" name="time" value="' + esc(k.remind || '18:00') + '" style="width:130px" aria-label="שעת תזכורת"><button class="btn" type="submit" style="flex:1">הוספה ליומן בטלפון</button></form>' +
      '<span class="hint">נוצרת תזכורת יומית ביומן של הטלפון. בנוסף, אחרי השעה הזו תופיע באפליקציה הודעה אם נשארו משימות.</span></section>';
    return html + '</div>';
  }
  function weekDots(k) {
    var ws = weekStart(today()), t = today(), graceUsed = false, out = '';
    for (var i = 0; i < 7; i++) {
      var d = addDays(ws, i), cls = 'dot', inner = '', st;
      if (d > t) { /* עתידי */ }
      else if (d === t) {
        var due = dueFor(k.id, d), n = due.filter(function (x) { return isDone(statusOf(x, k.id, d)); }).length;
        if (due.length && n === due.length) { cls += ' full'; inner = ic('check', 16); }
        else { cls += ' today'; inner = due.length ? n + '/' + due.length : ''; }
      } else {
        st = dayState(k.id, d);
        if (st === 'full') { cls += ' full'; inner = ic('check', 16); }
        else if (st === 'none') { inner = '–'; }
        else if (!graceUsed) { graceUsed = true; cls += ' grace'; inner = 'חסד'; }
        else { cls += ' miss'; }
      }
      out += '<div class="day' + (d === t ? ' now' : '') + '"><div class="' + cls + '"' + (cls.indexOf('full') >= 0 ? ' style="background:' + esc(k.color) + ';color:' + onColor(k.color) + '"' : '') + '>' + inner + '</div>' + DAY_L[i] + '</div>';
    }
    return '<div class="week">' + out + '</div>';
  }
  function badges(k) {
    var ws = weekStart(today()), b = [], stv = streak(k.id);
    var wk = logs().filter(function (l) { return l.kidId === k.id && l.status === 'approved' && l.date >= ws; });
    var school = wk.filter(function (l) { var t = S.tasks[l.taskId]; return t && t.cat === 'school'; }).length;
    var home = wk.filter(function (l) { var t = S.tasks[l.taskId]; return t && t.cat !== 'school'; }).length;
    if (stv >= 3) b.push('<span class="badge y">' + ic('flame', 14) + stv + ' ימים ברצף</span>');
    if (school >= 5) b.push('<span class="badge">' + ic('book', 14) + 'אלופ/ת שיעורי בית</span>');
    if (home >= 7) b.push('<span class="badge">' + ic('home', 14) + 'עוזר/ת הבית</span>');
    b.push('<span class="badge">' + ic('trophy', 14) + 'שלב ' + level(k.id).lv + '</span>');
    return '<div class="chips">' + b.join('') + '</div>';
  }
  function vBoard() {
    var fw = familyWeek(), tg = +S.family.goalTarget || 1;
    var html = '<div class="main"><div style="padding-top:calc(env(safe-area-inset-top) + 8px)"><h1 style="font-size:26px">טבלת השבוע</h1><p class="muted" style="margin:4px 0 0">כל המשפחה ביחד, כל אחד מול עצמו</p></div>' +
      '<section class="goal"><div class="row" style="gap:12px"><div class="goal-ic">' + ic('trophy', 28) + '</div><div style="display:flex;flex-direction:column;gap:2px"><span class="muted small">היעד המשפחתי השבוע</span><span style="font-size:20px;font-weight:700">' + esc(S.family.goalTitle) + '</span></div></div>' +
      bar(fw / tg * 100, 'big y') +
      '<div class="between"><span class="b">' + fw + ' / ' + tg + '</span><span class="muted small">' + (fw >= tg ? 'הגענו ליעד!' : 'עוד ' + (tg - fw) + ' · כל משימה של כולם נספרת') + '</span></div></section>' +
      '<h2 class="sec-title">כל אחד מול עצמו</h2>';
    kids().forEach(function (k) {
      var c = selfCompare(k.id);
      var cmp = c.pct === null ? '<span class="down">שבוע ראשון</span>' : c.pct >= 0 ? '<span class="up">↑ ' + c.pct + '% משבוע שעבר</span>' : '<span class="down">' + c.pct + '% משבוע שעבר</span>';
      html += '<section class="card"><div class="row">' + av(k) + '<div style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="b" style="font-size:17px">' + esc(k.name) + '</span><span class="muted">' + c.cur + ' נק׳ השבוע</span></div>' + cmp + '</div>' + weekDots(k) + badges(k) + '</section>';
    });
    if (!kids().length) html += '<div class="empty">עוד לא נוספו ילדים</div>';
    return html + '</div>';
  }

  // ---------- מסכי הורה ----------
  function pendingLogs() { return logs().filter(function (l) { return l.status === 'pending'; }).sort(function (a, b) { return a.c - b.c; }); }
  function pendingReds() { return alive(S.reds).filter(function (r) { return r.status === 'pending'; }).sort(function (a, b) { return a.c - b.c; }); }
  function ago(ts) {
    var m = Math.round((now() - ts) / 60000);
    if (m < 1) return 'עכשיו'; if (m < 60) return 'לפני ' + m + ' דק׳';
    var h = Math.round(m / 60); if (h < 24) return 'לפני ' + h + ' שע׳';
    return 'לפני ' + Math.round(h / 24) + ' ימים';
  }
  function parentHero(p, title, sub, extra) {
    return '<header class="hero parent"><div class="hero-row"><div class="hero-txt"><h1 class="hero-title">' + title + '</h1><span class="hero-sub">' + sub + '</span></div>' +
      (SYNC ? '<span class="iconbtn" title="סנכרון" aria-label="מצב סנכרון: ' + (ui.sync === 'err' ? 'שגיאה' : 'תקין') + '" style="color:' + (ui.sync === 'err' ? '#FF8A80' : 'var(--yellow)') + '">' + ic('cloud') + '</span>' : '') +
      '<button class="iconbtn" data-act="logout" aria-label="החלפת משתמש">' + ic('logout') + '</button></div>' + (extra || '') + '</header>';
  }
  function vParentHome(p) {
    var pl = pendingLogs(), pr = pendingReds(), n = pl.length + pr.length;
    var html = parentHero(p, 'שלום ' + esc(p.name), 'יום ' + DAY_N[dow(today())] + (n ? ' · ' + n + ' ממתינים לאישור' : ' · הכל מאושר'),
      '<div class="btns"><button class="btn" data-act="taskForm">' + ic('plus', 18) + 'משימה חדשה</button><button class="btn y" data-act="pointsForm">' + ic('star', 18) + 'נקודות בונוס</button></div>') + '<div class="main">';
    html += '<h2 class="sec-title">ממתין לאישור</h2>';
    if (!n) html += '<div class="empty">אין מה לאשר כרגע</div>';
    pl.forEach(function (l) {
      var k = S.members[l.kidId] || { name: '?' };
      html += '<article class="card"><div class="row">' + av(k, 's') + '<div class="txt" style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-weight:500">' + esc(l.title) + '</span><span class="muted small">' + esc(k.name) + ' · ' + ago(l.c) + (l.date !== today() ? ' · ' + DAY_N[dow(l.date)] : '') + '</span></div>' + ptsBadge(l.points) + '</div>' +
        (l.photo ? '<img class="proof" src="' + esc(l.photo) + '" alt="תמונת הוכחה מ' + esc(k.name) + '">' : '') +
        '<div class="btns"><button class="btn ok" data-act="approve" data-id="' + l.id + '">אישור</button><button class="btn ghost" data-act="rejectForm" data-id="' + l.id + '">להחזיר עם הערה</button></div></article>';
    });
    pr.forEach(function (r) {
      var k = S.members[r.kidId] || { name: '?' };
      html += '<article class="card" style="border:2px solid var(--yellow)"><div class="row">' + av(k, 's') + '<div style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="small" style="color:var(--yellow-d);font-weight:500">בקשה למימוש פרס · ' + esc(k.name) + '</span><span style="font-weight:500">' + esc(r.title) + '</span></div><span class="pts grey">' + r.cost + '−</span></div>' +
        '<div class="btns"><button class="btn" data-act="redApprove" data-id="' + r.id + '">אישור</button><button class="btn ghost" data-act="redReject" data-id="' + r.id + '">לא עכשיו</button></div></article>';
    });
    html += '<h2 class="sec-title">הילדים היום</h2><section class="card">';
    if (!kids().length) html += '<p class="muted" style="margin:0">עוד לא הוספתם ילדים. <button class="linkbtn" data-act="tab" data-id="family">הוספת ילד/ה</button></p>';
    kids().forEach(function (k) {
      var due = dueFor(k.id, today()), dn = due.filter(function (t) { return isDone(statusOf(t, k.id, today())); }).length;
      html += '<div class="row"><span style="width:64px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(k.name) + '</span><div style="flex:1">' + bar(due.length ? dn / due.length * 100 : 0) + '</div><span class="muted" style="width:44px;text-align:left">' + dn + '/' + due.length + '</span></div>';
    });
    html += '</section>' + weeklySummary() + '</div>';
    return html;
  }
  function weeklySummary() {
    if (!kids().length) return '';
    var t = today(), ws = weekStart(t), lws = addDays(ws, -7), lt = addDays(t, -7);
    var cur = logs().filter(function (l) { return l.taskId && isDone(l.status) && l.date >= ws && l.date <= t; }).length;
    var last = logs().filter(function (l) { return l.taskId && isDone(l.status) && l.date >= lws && l.date <= lt; }).length;
    var miss = {}, worst = null;
    for (var d = ws; d < t; d = addDays(d, 1)) {
      kids().forEach(function (k) {
        dueFor(k.id, d).forEach(function (task) {
          miss[task.id] = miss[task.id] || { t: task, due: 0, done: 0 };
          miss[task.id].due++;
          if (isDone(statusOf(task, k.id, d))) miss[task.id].done++;
        });
      });
    }
    Object.keys(miss).forEach(function (id) { var m = miss[id]; if (m.done < m.due && (!worst || m.done / m.due < worst.done / worst.due)) worst = m; });
    var txt = cur + ' משימות בוצעו השבוע' + (last ? (cur >= last ? ', יותר מאשר באותה נקודה בשבוע שעבר (' + last + ')' : ', פחות מאשר באותה נקודה בשבוע שעבר (' + last + ')') : '') + '.';
    if (worst) txt += ' הכי מאתגר: ' + worst.t.title + ' (' + worst.done + ' מתוך ' + worst.due + ').';
    return '<section class="card" style="background:var(--blue-l)"><span class="small b" style="color:var(--blue-d)">סיכום שבועי</span><span style="line-height:1.5">' + esc(txt) + '</span></section>';
  }
  function recLabel(t) {
    if (t.rec === 'once') return 'פעם אחת · ' + t.date.split('-').reverse().slice(0, 2).join('.');
    if (t.rec === 'days') return (t.days || []).slice().sort().map(function (d) { return DAY_L[d]; }).join(' ');
    return 'כל יום';
  }
  function asLabel(t) {
    if (!t.as || !t.as.length) return 'כל הילדים';
    return t.as.map(function (id) { return S.members[id] && !S.members[id].del ? S.members[id].name : null; }).filter(Boolean).join(', ') || 'אף אחד';
  }
  function vParentTasks(p) {
    var all = alive(S.tasks).filter(function (t) { return !(t.rec === 'once' && t.date < today()); }).sort(byCreated);
    var html = parentHero(p, 'משימות', all.length + ' משימות פעילות', '<div class="btns"><button class="btn y" data-act="taskForm">' + ic('plus', 18) + 'משימה חדשה</button><button class="btn" data-act="examForm">' + ic('exam', 18) + 'הכנה למבחן</button></div>') + '<div class="main">';
    var ex = alive(S.exams).filter(function (e) { return e.date >= today(); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (ex.length) {
      html += '<h2 class="sec-title">' + ic('exam') + 'מבחנים קרובים</h2><div class="list">' + ex.map(function (e) {
        var k = S.members[e.kidId] || { name: '?' };
        return '<div class="item">' + av(k, 's') + '<div class="txt"><span class="ttl">' + esc(e.subject) + ' · ' + esc(k.name) + '</span><span class="muted small">יום ' + DAY_N[dow(e.date)] + ' ' + e.date.split('-').reverse().slice(0, 2).join('.') + ' · ' + e.stages + ' שלבי חזרה</span></div><button class="iconbtn light" data-act="delExam" data-id="' + e.id + '" aria-label="מחיקת המבחן">' + ic('x', 18) + '</button></div>';
      }).join('') + '</div>';
    }
    [['home', 'בבית', 'home'], ['school', 'בית ספר', 'book']].forEach(function (g) {
      var list = all.filter(function (t) { return (t.cat === 'school') === (g[0] === 'school'); });
      html += '<h2 class="sec-title">' + ic(g[2]) + g[1] + '</h2><div class="list">';
      if (!list.length) html += '<div class="empty">אין משימות</div>';
      list.forEach(function (t) {
        html += '<button class="item" data-act="taskForm" data-id="' + t.id + '" style="border:none;text-align:right;width:100%"><div class="txt"><span class="ttl">' + esc(t.title) + '</span><div class="tags"><span class="tag b">' + esc(recLabel(t)) + '</span><span class="tag">' + esc(asLabel(t)) + '</span>' +
          (t.bonus ? '<span class="tag y">הפתעה ×2</span>' : '') + (t.needsPhoto ? '<span class="tag">תמונה</span>' : '') + (!t.needsApproval ? '<span class="tag">בלי אישור</span>' : '') + '</div></div>' + ptsBadge(ptsOf(t)) + '</button>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }
  function vParentRewards(p) {
    var rw = alive(S.rewards).sort(function (a, b) { return a.cost - b.cost; });
    var html = parentHero(p, 'פרסים', rw.length + ' פרסים בחנות', '<button class="btn y block" data-act="rewardForm">' + ic('plus', 18) + 'פרס חדש</button>') + '<div class="main"><div class="list">';
    if (!rw.length) html += '<div class="empty">אין פרסים</div>';
    rw.forEach(function (r) {
      html += '<button class="item" data-act="rewardForm" data-id="' + r.id + '" style="border:none;text-align:right;width:100%"><div class="rw-ic" style="width:44px;height:44px">' + ic(r.icon || 'gift', 22) + '</div><div class="txt"><span class="ttl">' + esc(r.title) + '</span></div><span class="pts">' + r.cost + '</span></button>';
    });
    html += '</div><h2 class="sec-title">היסטוריית מימושים</h2><div class="list">';
    var hist = alive(S.reds).filter(function (r) { return r.status !== 'pending'; }).sort(function (a, b) { return b.u - a.u; }).slice(0, 10);
    if (!hist.length) html += '<div class="empty">עוד לא מומשו פרסים</div>';
    hist.forEach(function (r) {
      var k = S.members[r.kidId] || { name: '?' };
      html += '<div class="item">' + av(k, 's') + '<div class="txt"><span class="ttl">' + esc(r.title) + '</span><span class="muted small">' + esc(k.name) + ' · ' + ago(r.u) + '</span></div><span class="tag ' + (r.status === 'approved' ? 'b' : '') + '">' + (r.status === 'approved' ? 'אושר' : 'נדחה') + '</span></div>';
    });
    return html + '</div></div>';
  }
  function vParentFamily(p) {
    var html = parentHero(p, esc(S.family.name), kids().length + ' ילדים · ' + parents().length + ' הורים') + '<div class="main">';
    html += '<h2 class="sec-title">' + ic('users') + 'בני המשפחה</h2><div class="list">';
    members().forEach(function (m) {
      var sub = m.role === 'parent' ? 'הורה' : ('יתרה ' + balance(m.id) + ' נק׳ · ' + (m.mode === 'young' ? 'תצוגה לקטנים' : 'תצוגה רגילה') + (m.pin ? ' · עם קוד' : ''));
      html += '<button class="item" data-act="memberForm" data-id="' + m.id + '" style="border:none;text-align:right;width:100%">' + av(m, 's') + '<div class="txt"><span class="ttl">' + esc(m.name) + '</span><span class="muted small">' + sub + '</span></div>' + ic('edit', 18) + '</button>';
    });
    html += '</div><div class="btns"><button class="btn" data-act="memberForm" data-role="kid">' + ic('plus', 18) + 'ילד/ה</button><button class="btn ghost" data-act="memberForm" data-role="parent">' + ic('plus', 18) + 'הורה</button></div>';
    html += '<h2 class="sec-title">' + ic('trophy') + 'יעד משפחתי שבועי</h2><button class="item" data-act="goalForm" style="border:none;text-align:right;width:100%"><div class="txt"><span class="ttl">' + esc(S.family.goalTitle) + '</span><span class="muted small">' + S.family.goalTarget + ' נקודות · מתאפס בכל יום ראשון</span></div>' + ic('edit', 18) + '</button>';
    html += '<h2 class="sec-title">' + ic('cloud') + 'סנכרון וגיבוי</h2><section class="card">';
    if (SYNC) {
      var link = location.origin + location.pathname + '?f=' + encodeURIComponent(code);
      html += '<span class="muted">קוד המשפחה (לחיבור טלפון נוסף):</span><div class="code">' + esc(code) + '</div>' +
        '<div class="btns"><button class="btn ghost sm" data-act="copy" data-val="' + esc(link) + '">' + ic('copy', 16) + 'העתקת קישור</button><button class="btn ghost sm" data-act="syncNow">סנכרון עכשיו</button></div>' +
        '<span class="hint">' + (ui.sync === 'err' ? 'הסנכרון האחרון נכשל, ננסה שוב' : ui.syncAt ? 'סונכרן ' + ago(ui.syncAt) : 'ממתין לסנכרון') + '. מי שמחזיק בקישור יכול לראות ולשנות את נתוני המשפחה.</span>';
    } else {
      html += '<span class="muted">מצב מקומי: הנתונים שמורים רק במכשיר הזה. כדי לעבוד מכמה טלפונים צריך לחבר Supabase.</span>';
    }
    html += '<div class="btns"><button class="btn ghost sm" data-act="export">גיבוי לקובץ</button><button class="btn ghost sm" data-act="import">שחזור מגיבוי</button></div></section>';
    html += '<button class="btn danger block" data-act="leave">ניתוק המכשיר מהמשפחה</button></div>';
    return html;
  }

  // ---------- טפסים ----------
  function taskForm(id) {
    var t = id ? S.tasks[id] : { cat: 'home', points: 10, as: [], rec: 'daily', days: [0, 1, 2, 3, 4], date: today(), needsApproval: true, needsPhoto: false, bonus: false };
    var ks = kids();
    return '<form data-form="task" data-id="' + (id || '') + '"><h2>' + (id ? 'עריכת משימה' : 'משימה חדשה') + '</h2>' +
      '<div class="field"><label for="t-title">מה צריך לעשות?</label><input class="inp" id="t-title" name="title" required maxlength="60" value="' + esc(t.title || '') + '"></div>' +
      '<div class="field"><span class="lbl">סוג</span><div class="seg">' + seg('cat', 'home', 'בבית', t.cat !== 'school') + seg('cat', 'school', 'בית ספר', t.cat === 'school') + '</div></div>' +
      '<div class="field pts-field"><label for="t-pts">נקודות</label><input class="inp" id="t-pts" name="points" type="number" inputmode="numeric" min="1" max="1000" required value="' + (t.points || 10) + '"></div>' +
      (ks.length ? '<div class="field"><span class="lbl">למי?</span><div class="seg">' + ks.map(function (k) { return '<label><input type="checkbox" name="as" value="' + k.id + '"' + (t.as && t.as.indexOf(k.id) >= 0 ? ' checked' : '') + '><span>' + esc(k.name) + '</span></label>'; }).join('') + '</div><span class="hint">בלי סימון = כל הילדים</span></div>' : '') +
      '<div class="field"><span class="lbl">מתי?</span><div class="seg">' + seg('rec', 'daily', 'כל יום', t.rec === 'daily') + seg('rec', 'days', 'ימים קבועים', t.rec === 'days') + seg('rec', 'once', 'פעם אחת', t.rec === 'once') + '</div></div>' +
      '<div class="seg days rec-days">' + DAY_L.map(function (l, i) { return '<label><input type="checkbox" name="day" value="' + i + '"' + ((t.days || []).indexOf(i) >= 0 ? ' checked' : '') + ' aria-label="יום ' + DAY_N[i] + '"><span>' + l + '</span></label>'; }).join('') + '</div>' +
      '<div class="field rec-once"><label for="t-date">תאריך</label><input class="inp" id="t-date" type="date" name="date" value="' + esc(t.date || today()) + '"></div>' +
      '<div class="field"><label for="t-note">הערה לילד (לא חובה)</label><input class="inp" id="t-note" name="note" maxlength="60" value="' + esc(t.note || '') + '" placeholder="למשל: עד 20:00"></div>' +
      tog('duty', 'חובה בסיסית (בלי נקודות)', t.duty) + tog('needsApproval', 'צריך אישור הורה', t.needsApproval) + tog('needsPhoto', 'לצלם הוכחה', t.needsPhoto) + tog('bonus', 'משימת הפתעה (נקודות כפולות)', t.bonus) +
      '<span class="hint">חובה בסיסית נספרת להתקדמות ולרצף, אבל לא מזכה בנקודות.</span>' +
      '<button class="btn block" type="submit">שמירה</button>' +
      (id ? '<button class="btn danger block" type="button" data-act="delTask" data-id="' + id + '">מחיקת המשימה</button>' : '') +
      '<button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function examForm() {
    var ks = kids();
    if (!ks.length) return '<h2>הכנה למבחן</h2><p>קודם צריך להוסיף ילדים.</p><button class="btn block" data-act="closeModal">סגירה</button>';
    return '<form data-form="exam"><h2>הכנה למבחן</h2>' +
      '<div class="field"><span class="lbl">למי?</span><div class="seg">' + ks.map(function (k, i) { return seg('kid', k.id, esc(k.name), i === 0); }).join('') + '</div></div>' +
      '<div class="field"><label for="e-sub">מקצוע</label><input class="inp" id="e-sub" name="subject" required maxlength="30" placeholder="למשל: מדעים"></div>' +
      '<div class="field"><label for="e-date">תאריך המבחן</label><input class="inp" id="e-date" type="date" name="date" required min="' + addDays(today(), 1) + '" value="' + addDays(today(), 4) + '"></div>' +
      '<div class="field"><span class="lbl">כמה ימי חזרה לפני?</span><div class="seg">' + [1, 2, 3, 4, 5].map(function (n) { return seg('stages', n, String(n), n === 3); }).join('') + '</div><span class="hint">כל יום חזרה הופך למשימה נפרדת (בלי שבת)</span></div>' +
      '<div class="field"><label for="e-pts">נקודות לכל שלב</label><input class="inp" id="e-pts" name="points" type="number" inputmode="numeric" min="1" max="1000" required value="15"></div>' +
      '<button class="btn block" type="submit">יצירת תוכנית חזרה</button><button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function seg(name, val, label, on) { return '<label><input type="radio" name="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>'; }
  function tog(name, label, on) { return '<label class="toggle"><span>' + label + '</span><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '></label>'; }
  function rewardForm(id) {
    var r = id ? S.rewards[id] : { cost: 100, icon: 'gift' };
    return '<form data-form="reward" data-id="' + (id || '') + '"><h2>' + (id ? 'עריכת פרס' : 'פרס חדש') + '</h2>' +
      '<div class="field"><label for="r-title">שם הפרס</label><input class="inp" id="r-title" name="title" required maxlength="40" value="' + esc(r.title || '') + '"></div>' +
      '<div class="field"><label for="r-cost">מחיר בנקודות</label><input class="inp" id="r-cost" name="cost" type="number" inputmode="numeric" min="1" max="100000" required value="' + r.cost + '"></div>' +
      '<div class="field"><span class="lbl">אייקון</span><div class="seg">' + Object.keys(RW_ICONS).map(function (k) { return '<label><input type="radio" name="icon" value="' + k + '"' + (r.icon === k ? ' checked' : '') + ' aria-label="' + RW_ICONS[k] + '"><span>' + ic(k, 18) + '</span></label>'; }).join('') + '</div></div>' +
      '<button class="btn block" type="submit">שמירה</button>' +
      (id ? '<button class="btn danger block" type="button" data-act="delReward" data-id="' + id + '">מחיקת הפרס</button>' : '') +
      '<button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function memberForm(id, role) {
    var m = id ? S.members[id] : { role: role || 'kid', color: COLORS[kids().length % COLORS.length], mode: 'big' };
    var isKid = m.role === 'kid';
    return '<form data-form="member" data-id="' + (id || '') + '" data-role="' + m.role + '"><h2>' + (id ? 'עריכה: ' + esc(m.name) : isKid ? 'ילד/ה חדש/ה' : 'הורה נוסף') + '</h2>' +
      '<div class="field"><label for="m-name">שם</label><input class="inp" id="m-name" name="name" required maxlength="20" value="' + esc(m.name || '') + '"></div>' +
      '<div class="field"><span class="lbl">צבע</span><div class="seg swatch">' + COLORS.map(function (c) { return '<label><input type="radio" name="color" value="' + c + '"' + (m.color === c ? ' checked' : '') + ' aria-label="צבע"><span style="background:' + c + '"></span></label>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="m-pin">' + (isKid ? 'קוד כניסה (לא חובה)' : 'קוד הורה (4 ספרות)') + '</label><input class="inp pin" id="m-pin" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off"' + (!isKid && !id ? ' required' : '') + '><span class="hint">' + (id ? 'השאירו ריק כדי לא לשנות' + (isKid && m.pin ? '. לביטול הקוד הקלידו 0000' : '') : isKid ? 'בלי קוד, הילד נכנס בלחיצה על התמונה' : '') + '</span></div>' +
      (isKid ? '<div class="field"><span class="lbl">תצוגה</span><div class="seg">' + seg('mode', 'big', 'רגילה', m.mode !== 'young') + seg('mode', 'young', 'לקטנים (גדול ופשוט)', m.mode === 'young') + '</div></div>' : '') +
      '<button class="btn block" type="submit">שמירה</button>' +
      (id && id !== me ? '<button class="btn danger block" type="button" data-act="delMember" data-id="' + id + '">הסרה מהמשפחה</button>' : '') +
      '<button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function goalForm() {
    return '<form data-form="goal"><h2>יעד משפחתי שבועי</h2>' +
      '<div class="field"><label for="g-title">מה מקבלים כשמגיעים ליעד?</label><input class="inp" id="g-title" name="title" required maxlength="40" value="' + esc(S.family.goalTitle) + '"></div>' +
      '<div class="field"><label for="g-t">כמה נקודות צריך לצבור יחד?</label><input class="inp" id="g-t" name="target" type="number" inputmode="numeric" min="10" max="100000" required value="' + S.family.goalTarget + '"></div>' +
      '<span class="hint">הנקודות של כל הילדים נספרות יחד, והיעד מתאפס בכל יום ראשון.</span>' +
      '<button class="btn block" type="submit">שמירה</button><button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function pointsForm() {
    var ks = kids();
    if (!ks.length) return '<h2>נקודות בונוס</h2><p>קודם צריך להוסיף ילדים.</p><button class="btn block" data-act="closeModal">סגירה</button>';
    return '<form data-form="points"><h2>נקודות בונוס</h2>' +
      '<div class="field"><span class="lbl">למי?</span><div class="seg">' + ks.map(function (k, i) { return seg('kid', k.id, esc(k.name), i === 0); }).join('') + '</div></div>' +
      '<div class="field"><label for="p-n">כמה נקודות?</label><input class="inp" id="p-n" name="n" type="number" inputmode="numeric" min="1" max="1000" required value="10"></div>' +
      '<div class="field"><label for="p-why">על מה?</label><input class="inp" id="p-why" name="why" required maxlength="50" placeholder="למשל: עזר לאח הקטן"></div>' +
      '<button class="btn y block" type="submit">הענקה</button><button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function rejectForm(id) {
    var l = S.logs[id];
    return '<form data-form="reject" data-id="' + id + '"><h2>להחזיר: ' + esc(l.title) + '</h2>' +
      '<div class="field"><label for="rj">מה עוד צריך לעשות?</label><input class="inp" id="rj" name="note" maxlength="60" placeholder="למשל: נשארו בגדים על הרצפה"></div>' +
      '<button class="btn block" type="submit">החזרה לילד</button><button class="linkbtn" type="button" data-act="closeModal">ביטול</button></form>';
  }
  function confirmBox(text, act, id, btn) {
    return '<h2 style="margin-bottom:10px">' + text + '</h2><div class="btns"><button class="btn danger" data-act="' + act + '" data-id="' + (id || '') + '">' + (btn || 'כן') + '</button><button class="btn ghost" data-act="closeModal">ביטול</button></div>';
  }

  // ---------- פעולות ----------
  function submitLog(t, photo) {
    var k = meM(), d = today(), id = logId(t.id, k.id, d), prev = S.logs[id];
    S.logs[id] = { id: id, taskId: t.id, kidId: k.id, date: d, title: t.title, points: ptsOf(t), status: t.needsApproval ? 'pending' : 'approved', photo: photo || null, note: null, c: prev && prev.c || now(), u: now() };
    commit(t.needsApproval ? 'נשלח לאישור. כל הכבוד!' : ptsOf(t) ? '+' + ptsOf(t) + ' נקודות!' : 'כל הכבוד!');
  }
  function compress(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 640, w = img.width, h = img.height, r = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * r); c.height = Math.round(h * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = rej; img.src = url;
    });
  }

  var actions = {
    closeModal: closeModal,
    tab: function (el) {
      ui.tab = el.dataset.id;
      var k = meM();
      if (ui.tab === 'me' && k && k.role === 'kid') { var lv = level(k.id).lv; if ((k.seenLv || 1) < lv) { k.seenLv = lv; touch(k); save(); if (SYNC && code) syncNow(); } }
      render(); window.scrollTo(0, 0);
    },
    logout: function () { me = null; ls.del(K_ME); ui.pinFor = null; ui.tab = null; render(); },
    pick: function (el) {
      var m = S.members[el.dataset.id];
      if (!m) return;
      if (m.pin) { ui.pinFor = m.id; render(); setTimeout(function () { var p = document.getElementById('f-pin2'); if (p) p.focus(); }, 30); return; }
      login(m.id);
    },
    tick: function (el) {
      var t = S.tasks[el.dataset.id];
      if (!t) return;
      if (t.needsPhoto) { ui.photoTask = t.id; var inp = document.getElementById('photoInput'); inp.value = ''; inp.click(); return; }
      submitLog(t);
    },
    untick: function (el) {
      var l = S.logs[logId(el.dataset.id, me, today())];
      if (l && l.status === 'pending') { touch(l).del = true; commit('בוטל'); }
    },
    redeem: function (el) {
      var r = S.rewards[el.dataset.id];
      openModal(confirmBox('לממש "' + esc(r.title) + '" ב-' + r.cost + ' נקודות?', 'redeemYes', r.id, 'כן, לממש'));
    },
    redeemYes: function (el) {
      var r = S.rewards[el.dataset.id], k = meM();
      closeModal();
      if (!r || balance(k.id) < r.cost) return toast('אין מספיק נקודות');
      var id = uid();
      S.reds[id] = { id: id, rewardId: r.id, kidId: k.id, title: r.title, cost: r.cost, status: 'pending', c: now(), u: now() };
      commit('הבקשה נשלחה להורים');
    },
    approve: function (el) { var l = S.logs[el.dataset.id]; if (!l) return; l.status = 'approved'; l.photo = null; touch(l); commit((l.points ? 'אושר: +' + l.points + ' ל' : 'אושר ל') + ((S.members[l.kidId] || {}).name || '')); },
    rejectForm: function (el) { openModal(rejectForm(el.dataset.id)); },
    redApprove: function (el) { var r = S.reds[el.dataset.id]; if (!r) return; r.status = 'approved'; touch(r); commit('הפרס אושר'); },
    redReject: function (el) { var r = S.reds[el.dataset.id]; if (!r) return; r.status = 'rejected'; touch(r); commit('הבקשה נדחתה והנקודות חזרו'); },
    taskForm: function (el) { openModal(taskForm(el.dataset.id)); },
    rewardForm: function (el) { openModal(rewardForm(el.dataset.id)); },
    memberForm: function (el) { openModal(memberForm(el.dataset.id, el.dataset.role)); },
    goalForm: function () { openModal(goalForm()); },
    pointsForm: function () { openModal(pointsForm()); },
    examForm: function () { openModal(examForm()); },
    delExam: function (el) { openModal(confirmBox('למחוק את המבחן ואת משימות החזרה שלו?', 'delExamYes', el.dataset.id, 'מחיקה')); },
    delExamYes: function (el) {
      var e = S.exams[el.dataset.id];
      if (e) { touch(e).del = true; alive(S.tasks).forEach(function (t) { if (t.examId === e.id) touch(t).del = true; }); }
      closeModal(); commit('המבחן נמחק');
    },
    avSet: function (el) {
      var k = meM(); if (!k) return;
      var a = k.av ? JSON.parse(JSON.stringify(k.av)) : defAv(), v = el.dataset.v;
      a[el.dataset.k] = /^\d+$/.test(v) && (el.dataset.k === 'skin' || el.dataset.k === 'hairC') ? +v : v;
      k.av = a; touch(k); commit();
    },
    delTask: function (el) { openModal(confirmBox('למחוק את המשימה?', 'delTaskYes', el.dataset.id, 'מחיקה')); },
    delTaskYes: function (el) { var t = S.tasks[el.dataset.id]; if (t) { touch(t).del = true; } closeModal(); commit('המשימה נמחקה'); },
    delReward: function (el) { openModal(confirmBox('למחוק את הפרס?', 'delRewardYes', el.dataset.id, 'מחיקה')); },
    delRewardYes: function (el) { var r = S.rewards[el.dataset.id]; if (r) { touch(r).del = true; } closeModal(); commit('הפרס נמחק'); },
    delMember: function (el) { openModal(confirmBox('להסיר את ' + esc(S.members[el.dataset.id].name) + ' מהמשפחה?', 'delMemberYes', el.dataset.id, 'הסרה')); },
    delMemberYes: function (el) { var m = S.members[el.dataset.id]; if (m) { touch(m).del = true; } closeModal(); commit('הוסר/ה'); },
    copy: function (el) {
      var v = el.dataset.val;
      if (navigator.share) { navigator.share({ title: 'כוכבי הבית', text: 'הצטרפות למשפחה שלנו בכוכבי הבית', url: v }).catch(function () {}); return; }
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('הקישור הועתק'); }, function () { toast(v); });
    },
    syncNow: function () { syncNow().then(function () { toast(ui.sync === 'err' ? 'הסנכרון נכשל' : 'סונכרן'); render(); }); },
    export: function () {
      var blob = new Blob([JSON.stringify({ code: code, state: S })], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kochvei-habayit-' + today() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
    },
    import: function () { var i = document.getElementById('importInput'); i.value = ''; i.click(); },
    leave: function () { openModal(confirmBox(SYNC ? 'לנתק את המכשיר? הנתונים יישארו בענן, ואפשר לחזור עם קוד המשפחה.' : 'לנתק את המכשיר? במצב מקומי כל הנתונים יימחקו. כדאי לגבות קודם.', 'leaveYes', '', 'ניתוק')); },
    leaveYes: function () { ls.del(K_STATE); ls.del(K_CODE); ls.del(K_ME); S = null; code = null; me = null; closeModal(); render(); }
  };
  function login(id) {
    me = id; ls.set(K_ME, id); ui.pinFor = null;
    ui.tab = S.members[id].role === 'parent' ? 'home' : 'today';
    render(); window.scrollTo(0, 0);
  }

  var forms = {
    create: function (f) {
      var pin = f.elements.pin.value.trim();
      if (!/^\d{4}$/.test(pin)) return toast('קוד הורה צריך להיות 4 ספרות');
      S = newState(f.elements.fam.value.trim());
      var id = uid();
      S.members[id] = { id: id, name: f.elements.pname.value.trim(), role: 'parent', color: '#0F2A5F', pin: pin, c: now(), u: now() };
      code = SYNC ? genCode() : 'local';
      ls.set(K_CODE, code);
      save(); login(id);
      if (SYNC) syncNow();
      setTimeout(function () { toast('המשפחה נוצרה. עכשיו מוסיפים ילדים'); ui.tab = 'family'; render(); }, 100);
    },
    join: function (f) {
      var c = normCode(f.elements.code.value);
      if (c.replace(/-/g, '').length !== 16) return toast('קוד משפחה צריך 16 תווים');
      toast('מתחבר...');
      rpc('hs_get', { p_code: c }).then(function (data) {
        if (!data) return toast('לא נמצאה משפחה עם הקוד הזה');
        S = data; code = c; ls.set(K_CODE, c); save();
        history.replaceState(null, '', location.pathname);
        render();
      }).catch(function () { toast('אין חיבור לשרת, נסו שוב'); });
    },
    pin: function (f) {
      var m = S.members[ui.pinFor];
      if (m && f.elements.pin.value === m.pin) login(m.id);
      else { toast('קוד שגוי'); f.elements.pin.value = ''; f.elements.pin.focus(); }
    },
    task: function (f) {
      var id = f.dataset.id || uid(), old = S.tasks[id] || {};
      var days = [].slice.call(f.querySelectorAll('input[name=day]:checked')).map(function (x) { return +x.value; });
      var rec = f.querySelector('input[name=rec]:checked').value, duty = f.elements.duty.checked;
      if (rec === 'days' && !days.length) return toast('בחרו לפחות יום אחד');
      S.tasks[id] = {
        id: id, title: f.elements.title.value.trim(), cat: f.querySelector('input[name=cat]:checked').value, points: duty ? 0 : Math.max(1, +f.elements.points.value || 1), duty: duty, examId: old.examId || null,
        as: [].slice.call(f.querySelectorAll('input[name=as]:checked')).map(function (x) { return x.value; }),
        rec: rec, days: days, date: f.elements.date.value || today(), note: f.elements.note.value.trim(),
        needsApproval: f.elements.needsApproval.checked, needsPhoto: f.elements.needsPhoto.checked, bonus: f.elements.bonus.checked,
        from: old.from || today(), c: old.c || now(), u: now()
      };
      closeModal(); commit(f.dataset.id ? 'המשימה עודכנה' : 'המשימה נוספה');
    },
    reward: function (f) {
      var id = f.dataset.id || uid(), old = S.rewards[id] || {};
      var icon = f.querySelector('input[name=icon]:checked');
      S.rewards[id] = { id: id, title: f.elements.title.value.trim(), cost: Math.max(1, +f.elements.cost.value || 1), icon: icon ? icon.value : 'gift', c: old.c || now(), u: now() };
      closeModal(); commit(f.dataset.id ? 'הפרס עודכן' : 'הפרס נוסף');
    },
    member: function (f) {
      var id = f.dataset.id || uid(), old = S.members[id] || {}, role = f.dataset.role, pin = f.elements.pin.value.trim();
      if (pin && !/^\d{4}$/.test(pin)) return toast('הקוד צריך להיות 4 ספרות');
      var color = f.querySelector('input[name=color]:checked');
      var m = { id: id, name: f.elements.name.value.trim(), role: role, av: old.av || (role === 'kid' ? defAv() : null), seenLv: old.seenLv || 1, remind: old.remind || null, color: color ? color.value : (old.color || COLORS[0]), pin: old.pin || null, mode: role === 'kid' ? f.querySelector('input[name=mode]:checked').value : null, c: old.c || now(), u: now() };
      if (pin) m.pin = (role === 'kid' && pin === '0000') ? null : pin;
      S.members[id] = m;
      closeModal(); commit(f.dataset.id ? 'עודכן' : m.name + ' נוסף/ה למשפחה');
    },
    exam: function (f) {
      var kid = f.querySelector('input[name=kid]:checked').value, sub = f.elements.subject.value.trim(), date = f.elements.date.value;
      var n = +f.querySelector('input[name=stages]:checked').value, pts = Math.max(1, +f.elements.points.value || 1);
      if (!date || date <= today()) return toast('בחרו תאריך עתידי');
      var days = [], d = addDays(date, -1);
      while (days.length < n && d >= today()) { if (dow(d) !== 6) days.unshift(d); d = addDays(d, -1); }
      if (!days.length) return toast('אין מספיק זמן לחזרה לפני המבחן');
      var eid = uid(), t0 = now();
      S.exams[eid] = { id: eid, kidId: kid, subject: sub, date: date, stages: days.length, c: t0, u: t0 };
      days.forEach(function (day, i) {
        var id = uid() + i;
        S.tasks[id] = { id: id, title: 'חזרה למבחן ב' + sub, cat: 'school', points: pts, rec: 'once', days: [], date: day, as: [kid], from: today(), examId: eid,
          note: 'שלב ' + (i + 1) + ' מתוך ' + days.length + ' · המבחן ביום ' + DAY_N[dow(date)], needsApproval: true, needsPhoto: false, bonus: false, duty: false, c: t0 + i, u: t0 };
      });
      closeModal(); commit('נוצרו ' + days.length + ' שלבי חזרה');
    },
    remind: function (f) {
      var k = meM(), tm = f.elements.time.value || '18:00';
      k.remind = tm; touch(k); commit('התזכורת נשמרה');
      var p = tm.split(':'), d = new Date(); d.setHours(+p[0], +p[1], 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1);
      var dt = ds(d).replace(/-/g, '') + 'T' + p[0] + p[1] + '00';
      var url = location.origin + location.pathname;
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//kochvei-habayit//he', 'BEGIN:VEVENT', 'UID:' + uid() + '@kochvei', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        'DTSTART;TZID=Asia/Jerusalem:' + dt, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', 'SUMMARY:כוכבי הבית: לבדוק את המשימות', 'URL:' + url, 'DESCRIPTION:' + url,
        'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:כוכבי הבית', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'kochvei-tizkoret.ics';
      document.body.appendChild(a); a.click(); a.remove();
    },
    goal: function (f) {
      S.family.goalTitle = f.elements.title.value.trim(); S.family.goalTarget = Math.max(10, +f.elements.target.value || 10); touch(S.family);
      closeModal(); commit('היעד עודכן');
    },
    points: function (f) {
      var kid = f.querySelector('input[name=kid]:checked').value, n = Math.max(1, +f.elements.n.value || 1), id = uid();
      S.logs[id] = { id: id, taskId: null, kidId: kid, date: today(), title: 'בונוס: ' + f.elements.why.value.trim(), points: n, status: 'approved', photo: null, c: now(), u: now() };
      closeModal(); commit('+' + n + ' ל' + S.members[kid].name);
    },
    reject: function (f) {
      var l = S.logs[f.dataset.id];
      if (l) { l.status = 'rejected'; l.note = f.elements.note.value.trim(); l.photo = null; touch(l); }
      closeModal(); commit('הוחזר לילד');
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var fn = actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el); }
  });
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var fn = forms[e.target.dataset.form];
    if (fn) fn(e.target);
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'f-pin2' && e.target.value.length === 4) forms.pin(e.target.form);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  document.getElementById('photoInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0], t = S && S.tasks[ui.photoTask];
    if (!file || !t) return;
    toast('מעלה תמונה...');
    compress(file).then(function (data) { submitLog(t, data); }, function () { toast('לא הצלחנו לקרוא את התמונה'); });
  });
  document.getElementById('importInput').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    file.text().then(function (txt) {
      var j = JSON.parse(txt);
      if (!j.state || !j.state.members) throw new Error('bad');
      S = merge(S, j.state);
      if (!code) { code = j.code || (SYNC ? genCode() : 'local'); ls.set(K_CODE, code); }
      commit('הגיבוי שוחזר');
    }).catch(function () { toast('הקובץ לא תקין'); });
  });

  // ---------- ציור ----------
  function render() {
    var app = document.getElementById('app'), html;
    var m = meM();
    document.body.classList.toggle('young', !!(m && m.role === 'kid' && m.mode === 'young'));
    if (!S) html = vSetup();
    else if (!m || m.del) { me = null; html = vPicker(); }
    else if (m.role === 'kid') {
      ui.tab = ['today', 'rewards', 'board', 'me'].indexOf(ui.tab) >= 0 ? ui.tab : 'today';
      html = (ui.tab === 'rewards' ? vKidRewards(m) : ui.tab === 'board' ? vBoard() : ui.tab === 'me' ? vKidMe(m) : vKidToday(m)) +
        nav([['today', 'home', 'היום'], ['rewards', 'gift', 'פרסים'], ['board', 'trophy', 'טבלה'], ['me', 'user', 'הדמות שלי', level(m.id).lv > (m.seenLv || 1) ? '!' : '']]);
    } else {
      ui.tab = ['home', 'tasks', 'rewards', 'board', 'family'].indexOf(ui.tab) >= 0 ? ui.tab : 'home';
      var n = pendingLogs().length + pendingReds().length;
      html = (ui.tab === 'tasks' ? vParentTasks(m) : ui.tab === 'rewards' ? vParentRewards(m) : ui.tab === 'board' ? vBoard() : ui.tab === 'family' ? vParentFamily(m) : vParentHome(m)) +
        nav([['home', 'check', 'אישורים', n || ''], ['tasks', 'list', 'משימות'], ['rewards', 'gift', 'פרסים'], ['board', 'trophy', 'טבלה'], ['family', 'users', 'משפחה']]);
    }
    app.innerHTML = html;
  }

  render();
  if (SYNC && code && S) syncNow();
})();
