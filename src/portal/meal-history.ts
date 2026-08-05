import { Hono } from "hono";
import { requireWebSession } from "../accounts/session.js";
import { getMealsByDate } from "../nutrition-platform/meals.js";
import { getProfile } from "../storage.js";
import { todayInTz, validateTz } from "../tz.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PORTAL_GRID_MARKER = '<div class="portal-grid">';
const PORTAL_BODY_END = "</body>";

function validCalendarDate(value: string): boolean {
    if (!DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day!));
    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month! - 1 &&
        parsed.getUTCDate() === day
    );
}

export function portalMealHistorySection(): string {
    return `<section class="portal-card wide" id="meal-history-card"><div class="portal-card-heading"><div><h2>Meal history</h2><p>Meals logged through ChatGPT appear here using your saved timezone. Zero-calorie entries are included.</p></div><div class="field portal-date-field"><label for="meal-history-date">Local date</label><input id="meal-history-date" type="date"></div></div><p id="meal-history-status" class="tiny" role="status">Loading meals…</p><ul id="meal-history-list" class="portal-list" aria-live="polite"></ul></section>`;
}

export function portalMealHistoryScript(): string {
    return `<script>
(()=>{
const input=document.getElementById('meal-history-date');
const list=document.getElementById('meal-history-list');
const status=document.getElementById('meal-history-status');
if(!input||!list||!status)return;
let activeDate='';
function text(value){return value==null?'':String(value)}
function metric(label,value,unit=''){const span=document.createElement('span');span.className='meal-metric';span.textContent=label+' '+text(value??0)+unit;return span}
function render(data){
 activeDate=data.date;
 input.value=data.date;
 list.replaceChildren();
 if(!data.meals.length){status.textContent='No meals logged for '+data.date+' ('+data.timezone+').';return}
 status.textContent=data.meals.length+' meal'+(data.meals.length===1?'':'s')+' for '+data.date+' · '+data.timezone;
 const formatter=new Intl.DateTimeFormat(undefined,{timeZone:data.timezone,hour:'numeric',minute:'2-digit'});
 for(const meal of data.meals){
  const item=document.createElement('li');
  const summary=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent=meal.description;
  const meta=document.createElement('small');
  meta.textContent=(meal.meal_type||'meal')+' · '+formatter.format(new Date(meal.logged_at));
  summary.append(title,meta);
  const metrics=document.createElement('div');
  metrics.className='meal-metrics';
  metrics.append(metric('Calories',meal.calories),metric('Protein',meal.protein_g,' g'),metric('Carbs',meal.carbs_g,' g'),metric('Fat',meal.fat_g,' g'));
  item.append(summary,metrics);
  if(meal.notes){const notes=document.createElement('small');notes.className='meal-notes';notes.textContent=meal.notes;item.append(notes)}
  list.append(item);
 }
}
async function load(date){
 const query=date?'?date='+encodeURIComponent(date):'';
 status.textContent='Loading meals…';
 try{
  const response=await fetch('/account/portal/meals'+query,{headers:{accept:'application/json'},cache:'no-store'});
  if(response.status===401){location.href='/account/login?return_to=%2Faccount%2Fportal';return}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Unable to load meals');
  render(data);
 }catch(error){status.textContent=error instanceof Error?error.message:'Unable to load meals'}
}
input.addEventListener('change',()=>load(input.value));
load('');
setInterval(()=>{if(!document.hidden)load(activeDate)},20000);
})();
</script>`;
}

export function injectMealHistoryIntoPortal(html: string): string {
    if (html.includes('id="meal-history-card"')) return html;
    if (!html.includes(PORTAL_GRID_MARKER) || !html.includes(PORTAL_BODY_END)) {
        return html;
    }
    return html
        .replace(
            PORTAL_GRID_MARKER,
            `${PORTAL_GRID_MARKER}${portalMealHistorySection()}`,
        )
        .replace(
            PORTAL_BODY_END,
            `${portalMealHistoryScript()}${PORTAL_BODY_END}`,
        );
}

export function createMealHistoryRouter(): Hono {
    const portal = new Hono();

    portal.get("/portal-controls.css", async (c) =>
        c.body(await Bun.file("./public/portal-controls.css").text(), 200, {
            "Content-Type": "text/css; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        }),
    );

    portal.get("/account/portal/meals", requireWebSession, async (c) => {
        const profile = await getProfile(c.get("munchUserId"));
        const timezone =
            profile?.timezone && validateTz(profile.timezone)
                ? profile.timezone
                : "UTC";
        const requestedDate = c.req.query("date")?.trim();
        const date = requestedDate || todayInTz(timezone);
        if (!validCalendarDate(date)) {
            return c.json({ error: "invalid_date" }, 400, {
                "Cache-Control": "private, no-store",
            });
        }

        const meals = await getMealsByDate(
            c.get("munchUserId"),
            date,
            timezone,
        );
        return c.json(
            {
                date,
                timezone,
                meals: meals.map(
                    ({ user_id: _userId, idempotency_key: _key, ...meal }) =>
                        meal,
                ),
            },
            200,
            {
                "Cache-Control": "private, no-store",
                Pragma: "no-cache",
            },
        );
    });

    return portal;
}
