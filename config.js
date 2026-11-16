// הגדרות סנכרון בין מכשירים (Supabase).
// מחובר לפרויקט arcaide (טבלה נפרדת hs_families). כל עוד השדות ריקים, האפליקציה עובדת במצב מקומי: הנתונים נשמרים רק במכשיר הנוכחי.
// להפעלת סנכרון: יוצרים פרויקט ב-Supabase, מריצים את supabase.sql, וממלאים כאן:
window.HS_CONFIG = {
  supabaseUrl: 'https://dncpegqhpfrvcpjluffb.supabase.co',   // לדוגמה: 'https://xxxx.supabase.co'
  supabaseKey: 'sb_publishable_gxt1IGpvsTDoo-cqVenyyA_1-7E3u6D'    // ה-anon public key של הפרויקט
};
