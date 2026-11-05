/**
 * dsh-nanny-calendar — Client half.
 *
 * A sidebar entry ("育儿嫂日历") plus its own `main` page: a month calendar
 * board that records the nanny's onboarding / offboarding, leave days and
 * salary payouts. Records live in localStorage under one versioned key.
 *
 * Packaging contract (mirrors @deepseek-ai/dsh-client-ui-*):
 *   window.__ModuleLoader__.load({ id, factory }) with exports.inject = ["slots"]
 *   and exports.apply(ctx). Declared via package.json "dsh.client".
 */
window.__ModuleLoader__.load({
  id: 'dsh-nanny-calendar',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const NS = 'dsh-nanny-calendar'
    const PANEL_ID = 'nanny-calendar'
    const STORE_KEY = 'dsh-nanny-calendar/v1'

    /* ------------------------------------------------------------------ */
    /* Locale                                                             */
    /* ------------------------------------------------------------------ */

    const DICT = {
      zh: {
        nav: '育儿嫂日历',
        pageTitle: '育儿嫂日历',
        pageSubtitle: '上户 · 休假 · 工资发放',
        monthTitle: '{y} 年 {m} 月',
        prevMonth: '上一月',
        nextMonth: '下一月',
        today: '今天',
        weekdayMon: '一',
        weekdayTue: '二',
        weekdayWed: '三',
        weekdayThu: '四',
        weekdayFri: '五',
        weekdaySat: '六',
        weekdaySun: '日',
        summary: '本月汇总',
        overall: '累计汇总',
        overallSince: '自 {from}',
        overallEmpty: '还没有上户记录；添加一次「上户」后开始累计。',
        statWork: '实际上班',
        statLeaveTotal: '累计休假',
        statEmployedTotal: '累计在户',
        statTotalSalary: '累计工资',
        statSpan: '跨度',
        statEmployed: '在户天数',
        statLeave: '休假天数',
        statSalary: '工资合计',
        statOnboard: '上户',
        statOffboard: '下户',
        unitDay: '天',
        unitTimes: '次',
        selectedDay: '选中日期',
        noRecordToday: '这一天还没有记录',
        recordsOfMonth: '本月记录',
        noRecordMonth: '本月还没有记录，点击日历中的日期开始记录。',
        addRecord: '添加记录',
        editRecord: '编辑记录',
        type: '类型',
        typeOnboard: '上户',
        typeOffboard: '下户',
        typeLeave: '休假',
        typeSalary: '工资',
        date: '日期',
        endDate: '结束日期',
        endDateHint: '留空表示只休一天',
        amount: '金额（元）',
        amountPlaceholder: '例如 8000',
        note: '备注',
        notePlaceholder: '选填，例如 8 月工资 / 病假',
        save: '保存',
        cancel: '取消',
        edit: '编辑',
        remove: '删除',
        removeConfirm: '删除这条记录？',
        clearAll: '清空全部数据',
        clearAllConfirm: '确定清空全部记录？此操作无法撤销。',
        errDate: '请选择日期',
        errEndDate: '结束日期不能早于开始日期',
        errAmount: '请填写有效的金额',
        backup: '数据备份',
        copyBackup: '复制备份',
        restoreBackup: '从剪贴板恢复',
        copied: '已复制',
        copyFailed: '复制失败，剪贴板不可用',
        restoreConfirm: '用剪贴板中的 {n} 条记录替换当前数据？',
        restored: '已恢复 {n} 条记录',
        restoreFailed: '剪贴板中没有可用的备份数据',
        saved: '已保存',
        dayLeave: '休假',
        recordsCount: '共 {n} 条',
        salaryPrefix: '工资',
        onboardPrefix: '上户',
        offboardPrefix: '下户',
        leavePrefix: '休假',
        paydayNext: '下个发薪日',
        paydayToday: '就是今天',
        paydayInDays: '{n} 天后',
        paydayCycle: '第 {n} 期 · 每期 30 天（26 个工作日 + 4 天休息）',
        paydayLabel: '发薪日 {date}（第 {n} 期）',
        paydayLabelPaid: '发薪日 {date}（第 {n} 期，已发薪）',
        paydayEmpty: '还没有上户记录；添加上户后自动排出发薪日。',
        paydayRule: '从上户日起每 30 天为一个周期，周期结束后的下个周期第一天是发薪日；每期 26 个工作日 + 4 天休息，法定节假日全年 13 天（元旦 1、清明 1、端午 1、中秋 1、五一 2、国庆 3、春节 4）另计。',
      },
      en: {
        nav: 'Nanny Calendar',
        pageTitle: 'Nanny Calendar',
        pageSubtitle: 'Onboarding · Leave · Salary',
        monthTitle: '{m}/{y}',
        prevMonth: 'Previous month',
        nextMonth: 'Next month',
        today: 'Today',
        weekdayMon: 'M',
        weekdayTue: 'T',
        weekdayWed: 'W',
        weekdayThu: 'T',
        weekdayFri: 'F',
        weekdaySat: 'S',
        weekdaySun: 'S',
        summary: 'This month',
        overall: 'All time',
        overallSince: 'since {from}',
        overallEmpty: 'No onboarding yet — add one to start the running total.',
        statWork: 'Days worked',
        statLeaveTotal: 'Total leave',
        statEmployedTotal: 'Total on duty',
        statTotalSalary: 'Salary paid',
        statSpan: 'Span',
        statEmployed: 'Days on duty',
        statLeave: 'Leave days',
        statSalary: 'Salary paid',
        statOnboard: 'Onboardings',
        statOffboard: 'Offboardings',
        unitDay: 'd',
        unitTimes: '',
        selectedDay: 'Selected day',
        noRecordToday: 'No record on this day yet',
        recordsOfMonth: 'Records this month',
        noRecordMonth: 'Nothing recorded this month. Pick a day to start.',
        addRecord: 'Add record',
        editRecord: 'Edit record',
        type: 'Type',
        typeOnboard: 'Onboard',
        typeOffboard: 'Offboard',
        typeLeave: 'Leave',
        typeSalary: 'Salary',
        date: 'Date',
        endDate: 'End date',
        endDateHint: 'Leave empty for a single day',
        amount: 'Amount',
        amountPlaceholder: 'e.g. 8000',
        note: 'Note',
        notePlaceholder: 'Optional, e.g. August salary / sick leave',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        remove: 'Delete',
        removeConfirm: 'Delete this record?',
        clearAll: 'Clear all data',
        clearAllConfirm: 'Clear every record? This cannot be undone.',
        errDate: 'Pick a date',
        errEndDate: 'The end date cannot be before the start date',
        errAmount: 'Enter a valid amount',
        backup: 'Backup',
        copyBackup: 'Copy backup',
        restoreBackup: 'Restore from clipboard',
        copied: 'Copied',
        copyFailed: 'Copy failed — clipboard unavailable',
        restoreConfirm: 'Replace the current data with the {n} records on the clipboard?',
        restored: 'Restored {n} records',
        restoreFailed: 'No usable backup found on the clipboard',
        saved: 'Saved',
        dayLeave: 'Leave',
        recordsCount: '{n} records',
        salaryPrefix: 'Salary',
        onboardPrefix: 'Onboard',
        offboardPrefix: 'Offboard',
        leavePrefix: 'Leave',
        paydayNext: 'Next payday',
        paydayToday: 'Today',
        paydayInDays: 'in {n} days',
        paydayCycle: 'Cycle {n} · 30 days (26 workdays + 4 rest days)',
        paydayLabel: 'Payday {date} (cycle {n})',
        paydayLabelPaid: 'Payday {date} (cycle {n}, paid)',
        paydayEmpty: 'No onboarding yet — add one and paydays appear automatically.',
        paydayRule: 'Each onboarding date starts a 30-day cycle; the first day of the next cycle is the payday. Each cycle is 26 workdays + 4 rest days; the 13 statutory holidays a year (New Year 1, Qingming 1, Dragon Boat 1, Mid-Autumn 1, Labour Day 2, National Day 3, Spring Festival 4) are counted separately.',
      },
    }

    const fallbackT = (key, params) => {
      let text = DICT.zh[key]
      if (text === undefined) return key
      if (params) for (const name of Object.keys(params)) text = text.split('{' + name + '}').join(String(params[name]))
      return text
    }

    const makeT = (t) => (key, params) => {
      if (typeof t === 'function') {
        let text
        try {
          text = t(key, params)
        } catch {
          text = undefined
        }
        if (typeof text === 'string' && text !== key) return text
      }
      return fallbackT(key, params)
    }

    /* ------------------------------------------------------------------ */
    /* Date helpers                                                       */
    /* ------------------------------------------------------------------ */

    const pad2 = (n) => (n < 10 ? '0' + n : '' + n)
    const toISO = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    const fromISO = (s) => {
      const parts = String(s).split('-').map(Number)
      return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1)
    }
    const todayISO = () => toISO(new Date())
    const monthOf = (iso) => String(iso).slice(0, 7)

    const addDays = (iso, n) => {
      const d = fromISO(iso)
      d.setDate(d.getDate() + n)
      return toISO(d)
    }

    /** Inclusive day count between two ISO dates (0 when to < from). */
    const dayCount = (from, to) => {
      if (to < from) return 0
      const a = fromISO(from)
      const b = fromISO(to)
      return Math.round((b - a) / 86400000) + 1
    }

    const addMonths = (month, delta) => {
      const parts = month.split('-').map(Number)
      const d = new Date(parts[0], parts[1] - 1 + delta, 1)
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1)
    }

    const daysInMonthOf = (month) => {
      const parts = month.split('-').map(Number)
      return new Date(parts[0], parts[1], 0).getDate()
    }

    /** Monday-first weekday index (0..6) of the 1st of the month. */
    const firstWeekday = (month) => {
      const parts = month.split('-').map(Number)
      const dow = new Date(parts[0], parts[1] - 1, 1).getDay()
      return (dow + 6) % 7
    }

    /** The 42 cells (6 weeks) the month grid renders, including lead/trail days. */
    const monthCells = (month) => {
      const lead = firstWeekday(month)
      const start = addDays(month + '-01', -lead)
      const cells = []
      for (let i = 0; i < 42; i += 1) cells.push(addDays(start, i))
      return cells
    }

    const monthLabel = (month, t) => {
      const parts = month.split('-').map(Number)
      return t('monthTitle', { y: parts[0], m: parts[1] })
    }

    const WEEKDAYS = ['weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun']

    /* ------------------------------------------------------------------ */
    /* Record model                                                       */
    /* ------------------------------------------------------------------ */

    const TYPES = ['onboard', 'offboard', 'leave', 'salary']

    /* Four clearly separated hues: green = on duty, red = leave,
       gold = money, neutral grey = off duty. */
    const TYPE_TONE = {
      onboard: 'var(--dsw-alias-state-success-primary, #16a34a)',
      offboard: 'var(--dsw-alias-label-tertiary, #9ca3af)',
      leave: 'var(--dsw-alias-state-error-primary, #dc2626)',
      salary: 'var(--dsw-alias-state-warn-primary, #b45309)',
    }

    const TYPE_LABEL = {
      onboard: 'typeOnboard',
      offboard: 'typeOffboard',
      leave: 'typeLeave',
      salary: 'typeSalary',
    }

    const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

    const emptyDraft = (date) => ({ id: null, type: 'leave', date, endDate: '', amount: '', note: '' })

    /** Every calendar day a record occupies. */
    const recordDays = (record) => {
      if (record.type !== 'leave' || !record.endDate || record.endDate <= record.date) return [record.date]
      const days = []
      let cursor = record.date
      let guard = 0
      while (cursor <= record.endDate && guard < 400) {
        days.push(cursor)
        cursor = addDays(cursor, 1)
        guard += 1
      }
      return days
    }

    const sortRecords = (records) =>
      records.slice().sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        const ia = TYPES.indexOf(a.type)
        const ib = TYPES.indexOf(b.type)
        return ia - ib
      })

    /** Employment intervals derived from onboard/offboard pairs: [startISO, endISO|null]. */
    const employmentIntervals = (records) => {
      const events = records.filter((r) => r.type === 'onboard' || r.type === 'offboard')
      events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      const out = []
      let open = null
      for (const event of events) {
        if (event.type === 'onboard') {
          if (open === null) open = event.date
        } else if (open !== null) {
          out.push([open, event.date])
          open = null
        } else {
          out.push([event.date, event.date])
        }
      }
      if (open !== null) out.push([open, null])
      return out
    }

    const monthSummary = (records, month) => {
      const first = month + '-01'
      const last = month + '-' + pad2(daysInMonthOf(month))
      const today = todayISO()

      let leaveDays = 0
      let salaryTotal = 0
      let salaryCount = 0
      let onboardCount = 0
      let offboardCount = 0

      for (const record of records) {
        if (record.type === 'salary') {
          if (monthOf(record.date) === month) {
            salaryTotal += Number(record.amount) || 0
            salaryCount += 1
          }
          continue
        }
        if (record.type === 'onboard' && monthOf(record.date) === month) onboardCount += 1
        if (record.type === 'offboard' && monthOf(record.date) === month) offboardCount += 1
        if (record.type === 'leave') {
          for (const day of recordDays(record)) if (monthOf(day) === month) leaveDays += 1
        }
      }

      let employedDays = 0
      for (const [start, end] of employmentIntervals(records)) {
        const from = start > first ? start : first
        const rawTo = end === null ? last : end < last ? end : last
        const to = end === null && month === monthOf(today) && today < last ? today : rawTo
        if (to < from) continue
        let cursor = from
        let guard = 0
        while (cursor <= to && guard < 400) {
          employedDays += 1
          cursor = addDays(cursor, 1)
          guard += 1
        }
      }

      return { leaveDays, salaryTotal, salaryCount, onboardCount, offboardCount, employedDays }
    }

    /**
     * Running totals from the first onboarding up to today.
     *
     * - employedDays: days inside onboard/offboard intervals, clipped to [from, today]
     * - leaveDays: leave days clipped to [from, today] that fall inside an interval
     * - workDays: employedDays minus leaveDays (days actually worked)
     * - spanDays: calendar days from `from` to today, inclusive
     * - salaryTotal / salaryCount: every salary record up to today
     */
    const overallSummary = (records) => {
      const today = todayISO()
      const onboards = records.filter((r) => r.type === 'onboard').map((r) => r.date)
      const empty = {
        from: null,
        to: today,
        employedDays: 0,
        workDays: 0,
        leaveDays: 0,
        spanDays: 0,
        salaryTotal: 0,
        salaryCount: 0,
        onboardCount: 0,
        offboardCount: 0,
      }
      if (onboards.length === 0) return empty

      const from = onboards.reduce((min, day) => (day < min ? day : min), onboards[0])

      const intervals = []
      let employedDays = 0
      for (const [start, end] of employmentIntervals(records)) {
        const clipFrom = start > from ? start : from
        const clipTo = end === null || end > today ? today : end
        if (clipTo < clipFrom) continue
        intervals.push([clipFrom, clipTo])
        employedDays += dayCount(clipFrom, clipTo)
      }

      /* Leave only counts on days the nanny was actually on duty, so that
         `workDays = employedDays - leaveDays` always stays consistent. */
      let leaveDays = 0
      for (const record of records) {
        if (record.type !== 'leave') continue
        for (const day of recordDays(record)) {
          if (day < from || day > today) continue
          if (intervals.some(([a, b]) => day >= a && day <= b)) leaveDays += 1
        }
      }

      let salaryTotal = 0
      let salaryCount = 0
      for (const record of records) {
        if (record.type !== 'salary') continue
        if (record.date > today) continue
        salaryTotal += Number(record.amount) || 0
        salaryCount += 1
      }

      const workDays = employedDays - leaveDays
      return {
        from,
        to: today,
        employedDays,
        workDays: workDays > 0 ? workDays : 0,
        leaveDays,
        spanDays: dayCount(from, today),
        salaryTotal,
        salaryCount,
        onboardCount: onboards.length,
        offboardCount: records.filter((r) => r.type === 'offboard').length,
      }
    }

    const formatMoney = (value) => {
      const n = Number(value) || 0
      return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    }

    /* ------------------------------------------------------------------ */
    /* Pay cycle                                                          */
    /* ------------------------------------------------------------------ */

    /* One cycle = 30 calendar days (26 workdays + 4 rest days). The 13
       statutory holidays a year are counted on top of that, not mapped to
       concrete dates, so the rule never goes stale. */
    const CYCLE_DAYS = 30

    /**
     * Paydays derived from the earliest onboarding. Cycle `n` covers
     * `start + (n-1)*30 ... start + n*30 - 1`; its payday is the first day
     * of the next cycle, i.e. `start + n*30`.
     * Each entry is `{ index, cycleFrom, cycleTo, date }`.
     * Cycles stop once she has been offboarded and not taken on again.
     */
    const payCycles = (records, until) => {
      const onboards = records.filter((r) => r.type === 'onboard').map((r) => r.date)
      if (onboards.length === 0) return []
      const start = onboards.reduce((min, day) => (day < min ? day : min), onboards[0])
      const intervals = employmentIntervals(records)
      const last = intervals[intervals.length - 1]
      /* When the last stint is closed she is no longer on duty. */
      const activeTo = last && last[1] !== null ? last[1] : null
      const horizon = until || todayISO()
      const out = []
      let index = 1
      let guard = 0
      while (guard < 400) {
        const cycleFrom = addDays(start, (index - 1) * CYCLE_DAYS)
        if (activeTo !== null && cycleFrom > activeTo) break
        const cycleTo = addDays(start, index * CYCLE_DAYS - 1)
        const date = addDays(cycleTo, 1)
        if (date > horizon) break
        out.push({ index, cycleFrom, cycleTo, date })
        index += 1
        guard += 1
      }
      return out
    }

    /**
     * Which cycles are already settled. A salary record pays the earliest
     * cycle that contains it: the cycle window itself, or its payday.
     * Records are consumed so one payment never settles two cycles.
     */
    const paidCycles = (records, cycles) => {
      const salaries = records
        .filter((r) => r.type === 'salary')
        .map((r) => ({ id: r.id, date: r.date }))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      const used = new Set()
      const paid = new Set()
      for (const cycle of cycles) {
        const hit = salaries.find(
          (item) => !used.has(item.id) && item.date >= cycle.cycleFrom && item.date <= cycle.date,
        )
        if (hit) {
          used.add(hit.id)
          paid.add(cycle.index)
        }
      }
      return paid
    }

    /** The next payday on or after today. */
    const nextPayday = (records, cycles) => {
      const today = todayISO()
      for (const cycle of cycles) {
        if (cycle.date >= today) return cycle
      }
      const onboards = records.filter((r) => r.type === 'onboard').map((r) => r.date)
      if (onboards.length === 0) return null
      /* Offboarded and not taken on again: no more paydays. */
      const intervals = employmentIntervals(records)
      const last = intervals[intervals.length - 1]
      const activeTo = last && last[1] !== null ? last[1] : null
      const start = onboards.reduce((min, day) => (day < min ? day : min), onboards[0])
      const index = cycles.length + 1
      const cycleFrom = addDays(start, (index - 1) * CYCLE_DAYS)
      const cycleTo = addDays(start, index * CYCLE_DAYS - 1)
      if (activeTo !== null && cycleFrom > activeTo) return null
      return { index, cycleFrom, cycleTo, date: addDays(cycleTo, 1) }
    }

    /* ------------------------------------------------------------------ */
    /* Persistence                                                        */
    /* ------------------------------------------------------------------ */

    const normalizeData = (raw) => {
      const data = { version: 1, records: [] }
      if (!raw || typeof raw !== 'object') return data
      const list = Array.isArray(raw.records) ? raw.records : []
      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue
        if (TYPES.indexOf(item.type) === -1) continue
        const record = { id: typeof item.id === 'string' ? item.id : newId(), type: item.type, date: item.date }
        if (item.type === 'leave' && typeof item.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.endDate) && item.endDate >= item.date) {
          record.endDate = item.endDate
        }
        if (item.type === 'salary' && Number.isFinite(Number(item.amount))) record.amount = Number(item.amount)
        if (typeof item.note === 'string' && item.note.trim() !== '') record.note = item.note.trim().slice(0, 200)
        data.records.push(record)
      }
      return data
    }

    const loadData = () => {
      try {
        const text = window.localStorage.getItem(STORE_KEY)
        if (!text) return { version: 1, records: [] }
        return normalizeData(JSON.parse(text))
      } catch {
        return { version: 1, records: [] }
      }
    }

    const saveData = (data) => {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(data))
        return true
      } catch {
        return false
      }
    }

    /* ------------------------------------------------------------------ */
    /* Styles                                                             */
    /* ------------------------------------------------------------------ */

    const CSS = [
      '.nc-root{box-sizing:border-box;height:100%;min-height:0;min-width:0;display:flex;flex-direction:column;',
      'container-type:inline-size;',
      'padding:calc(28px + var(--dsh-frame-top-clearance,0px)) 0 0;color:var(--dsw-alias-label-primary,#1f2328);}',
      '.nc-scroll{flex:1;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;',
      'padding:0 clamp(14px,3vw,40px) 48px;}',
      '.nc-wrap{width:100%;max-width:1180px;margin:0 auto;min-width:0;}',
      '.nc-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:6px 0 16px;}',
      '.nc-headText{flex:1;min-width:200px;}',
      '.nc-title{margin:0;font-size:20px;line-height:28px;font-weight:600;letter-spacing:.01em;}',
      '.nc-subtitle{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#6b7280);}',
      '.nc-nav{display:flex;align-items:center;gap:6px;}',
      '.nc-monthLabel{min-width:112px;text-align:center;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;}',
      '.nc-btn{font:inherit;font-size:12px;line-height:18px;height:28px;padding:0 10px;border-radius:8px;cursor:pointer;',
      'color:var(--dsw-alias-label-primary,#1f2328);background:var(--dsw-alias-bg-layer-1,#fff);',
      'border:.5px solid var(--dsw-alias-border-l3,#d9dde3);display:inline-flex;align-items:center;gap:5px;',
      'transition:background-color .12s,border-color .12s;}',
      '.nc-btn:hover{background:var(--dsw-alias-bg-layer-2,#f3f4f6);border-color:var(--dsw-alias-border-l2,#e5e7eb);}',
      '.nc-btn:disabled{cursor:default;opacity:.5;}',
      '.nc-btnIcon{width:28px;padding:0;justify-content:center;font-size:14px;line-height:1;}',
      '.nc-btnPrimary{color:var(--dsw-alias-label-primary-foreground,#fff);background:var(--dsw-alias-brand-primary,#4f6ef7);',
      'border-color:transparent;font-weight:600;}',
      '.nc-btnPrimary:hover{background:var(--dsw-alias-button-primary-hover,#3f5ee0);border-color:transparent;}',
      '.nc-btnGhost{border-color:transparent;background:transparent;}',
      '.nc-btnDanger{color:var(--dsw-alias-state-error-primary,#dc2626);}',
      '.nc-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,336px);gap:16px;align-items:start;}',
      '@container (max-width:880px){.nc-grid{grid-template-columns:minmax(0,1fr);}}',
      '@media (max-width:880px){.nc-grid{grid-template-columns:minmax(0,1fr);}}',
      '.nc-calendar{border:1px solid var(--dsw-alias-border-l2,#e5e7eb);border-radius:14px;overflow:hidden;',
      'background:var(--dsw-alias-bg-layer-1,#fff);}',
      '.nc-weekHead{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));background:var(--dsw-alias-bg-layer-2,#f3f4f6);',
      'border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb);}',
      '.nc-weekCell{text-align:center;font-size:11px;line-height:16px;padding:7px 0;font-weight:600;',
      'color:var(--dsw-alias-label-secondary,#6b7280);}',
      '.nc-cells{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));}',
      '.nc-cell{box-sizing:border-box;min-height:92px;padding:5px 5px 7px;display:flex;flex-direction:column;gap:3px;',
      'border-right:1px solid var(--dsw-alias-border-l1,#eef0f4);border-bottom:1px solid var(--dsw-alias-border-l1,#eef0f4);',
      'cursor:pointer;position:relative;min-width:0;}',
      '.nc-cell:nth-child(7n){border-right:none;}',
      '.nc-cell[data-dim=true]{background:var(--dsw-alias-bg-base,#fafafa);}',
      '.nc-cell[data-dim=true] .nc-dayNum{color:var(--dsw-alias-label-tertiary,#9ca3af);}',
      '.nc-cell[data-selected=true]{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary,#4f6ef7);}',
      '.nc-cell:hover{background:var(--dsw-alias-bg-layer-2,#f7f8fa);}',
      '.nc-dayHead{display:flex;align-items:center;justify-content:space-between;gap:4px;}',
      '.nc-dayNum{font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;min-width:18px;height:18px;',
      'display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:0 3px;font-weight:500;}',
      '.nc-dayNum[data-today=true]{background:var(--dsw-alias-brand-primary,#4f6ef7);',
      'color:var(--dsw-alias-label-primary-foreground,#fff);font-weight:600;}',
      '.nc-dayNum[data-weekend=true]:not([data-today=true]){color:var(--dsw-alias-label-secondary,#6b7280);}',
      '.nc-chips{display:flex;flex-direction:column;gap:2px;min-width:0;}',
      '.nc-chip{display:block;width:100%;box-sizing:border-box;border:none;border-left:2.5px solid var(--nc-tone);',
      'font-family:inherit;text-align:left;font-weight:600;',
      'font-size:10.5px;line-height:15px;padding:1px 4px;border-radius:4px;cursor:pointer;overflow:hidden;',
      'white-space:nowrap;text-overflow:ellipsis;color:var(--nc-tone);',
      'background:color-mix(in srgb, var(--nc-tone) 18%, transparent);}',
      '.nc-chip:hover{background:color-mix(in srgb, var(--nc-tone) 30%, transparent);}',
      '.nc-chip[data-editing=true]{outline:1.5px solid var(--nc-tone);}',
      '.nc-more{font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary,#9ca3af);padding-left:2px;}',
      '.nc-cell[data-payday=true]{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary,#b45309) 7%, transparent);}',
      '.nc-cell[data-payday=true][data-dim=true]{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary,#b45309) 4%, var(--dsw-alias-bg-base,#fafafa));}',
      '.nc-payTag{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;',
      'border-radius:5px;font-size:9.5px;line-height:1;font-weight:700;padding:0 3px;',
      'color:var(--dsw-alias-state-warn-primary,#b45309);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary,#b45309) 18%, transparent);}',
      '.nc-payTag[data-paid=true]{color:var(--dsw-alias-state-success-primary,#16a34a);',
      'background:color-mix(in srgb, var(--dsw-alias-state-success-primary,#16a34a) 15%, transparent);}',
      '.nc-paydayCard{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary,#b45309) 22%, var(--dsw-alias-border-l2,#e5e7eb));}',
      '.nc-paydayCard .nc-cardTitleText{color:var(--dsw-alias-state-warn-primary,#b45309);}',
      '.nc-payRow{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}',
      '.nc-payDate{font-size:17px;line-height:24px;font-weight:600;font-variant-numeric:tabular-nums;',
      'color:var(--dsw-alias-state-warn-primary,#b45309);}',
      '.nc-payWhen{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#6b7280);}',
      '.nc-payWhen[data-today=true]{color:var(--dsw-alias-state-warn-primary,#b45309);font-weight:600;}',
      '.nc-payRule{margin-top:6px;line-height:16px;}',
      '.nc-side{display:flex;flex-direction:column;gap:12px;min-width:0;}',
      '.nc-card{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,#e5e7eb);',
      'border-radius:14px;padding:12px 14px;}',
      '.nc-cardTitle{margin:0 0 10px;font-size:12px;line-height:18px;font-weight:600;',
      'color:var(--dsw-alias-label-secondary,#6b7280);display:flex;align-items:center;justify-content:space-between;gap:8px;}',
      '.nc-cardTitleText{font-size:13px;color:var(--dsw-alias-label-primary,#1f2328);}',
      '.nc-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}',
      '.nc-stat{background:var(--dsw-alias-bg-layer-2,#f7f8fa);border-radius:9px;padding:7px 8px;min-width:0;}',
      '.nc-statLabel{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-tertiary,#8b93a1);white-space:nowrap;',
      'overflow:hidden;text-overflow:ellipsis;}',
      '.nc-statValue{font-size:15px;line-height:22px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:1px;}',
      '.nc-statUnit{font-size:10.5px;font-weight:400;color:var(--dsw-alias-label-secondary,#6b7280);margin-left:2px;}',
      '.nc-stats2{grid-template-columns:repeat(2,minmax(0,1fr));}',
      '.nc-overall{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary,#4f6ef7) 26%, var(--dsw-alias-border-l2,#e5e7eb));}',
      '.nc-overall .nc-cardTitleText{color:var(--dsw-alias-brand-primary,#4f6ef7);}',
      '.nc-miniRow{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11.5px;line-height:18px;',
      'color:var(--dsw-alias-label-secondary,#6b7280);flex-wrap:wrap;}',
      '.nc-dot{width:6px;height:6px;border-radius:999px;background:var(--nc-tone);flex:none;}',
      '.nc-list{display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;}',
      '.nc-row{display:flex;align-items:flex-start;gap:8px;padding:7px 8px;border-radius:9px;',
      'border-left:2.5px solid var(--nc-tone);background:color-mix(in srgb, var(--nc-tone) 6%, var(--dsw-alias-bg-layer-2,#f7f8fa));',
      'min-width:0;}',
      '.nc-rowMain{flex:1;min-width:0;}',
      '.nc-rowTop{display:flex;align-items:baseline;gap:6px;min-width:0;}',
      '.nc-rowType{font-size:11px;line-height:16px;font-weight:600;color:var(--nc-tone);flex:none;',
      'padding:0 5px;border-radius:5px;background:color-mix(in srgb, var(--nc-tone) 16%, transparent);}',
      '.nc-rowDate{font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-tertiary,#9ca3af);',
      'font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.nc-rowNote{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary,#6b7280);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;}',
      '.nc-rowActions{display:flex;align-items:center;gap:2px;flex:none;}',
      '.nc-iconBtn{font:inherit;font-size:11px;line-height:16px;background:transparent;border:none;cursor:pointer;',
      'color:var(--dsw-alias-label-tertiary,#9ca3af);padding:2px 4px;border-radius:5px;}',
      '.nc-iconBtn:hover{color:var(--dsw-alias-label-primary,#1f2328);background:var(--dsw-alias-bg-layer-1,#fff);}',
      '.nc-iconBtnDanger:hover{color:var(--dsw-alias-state-error-primary,#dc2626);}',
      '.nc-empty{font-size:11.5px;line-height:18px;color:var(--dsw-alias-label-tertiary,#9ca3af);padding:4px 0;}',
      '.nc-form{display:flex;flex-direction:column;gap:9px;}',
      '.nc-seg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;',
      'background:var(--dsw-alias-bg-layer-2,#f3f4f6);border-radius:9px;padding:3px;}',
      '.nc-segBtn{font:inherit;font-size:11.5px;line-height:18px;height:24px;border:none;border-radius:6px;cursor:pointer;',
      'background:transparent;color:color-mix(in srgb, var(--nc-tone) 62%, var(--dsw-alias-label-secondary,#6b7280));',
      'padding:0;transition:background-color .12s,color .12s;}',
      '.nc-segBtn[data-on=true]{background:color-mix(in srgb, var(--nc-tone) 16%, var(--dsw-alias-bg-layer-1,#fff));',
      'color:var(--nc-tone);font-weight:700;',
      'box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--nc-tone) 45%, transparent);}',
      '.nc-field{display:flex;flex-direction:column;gap:4px;min-width:0;}',
      '.nc-fieldLabel{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#6b7280);}',
      '.nc-fieldRow{display:flex;gap:8px;min-width:0;}',
      '.nc-input{box-sizing:border-box;width:100%;min-width:0;font:inherit;font-size:12.5px;line-height:20px;',
      'height:30px;padding:0 8px;border-radius:8px;color:var(--dsw-alias-label-primary,#1f2328);',
      'background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l3,#d9dde3);}',
      '.nc-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#4f6ef7);',
      'box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary,#4f6ef7) 18%, transparent);}',
      '.nc-hint{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-tertiary,#9ca3af);}',
      '.nc-error{font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary,#dc2626);}',
      '.nc-formActions{display:flex;justify-content:flex-end;gap:6px;margin-top:2px;}',
      '.nc-footer{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px;padding-top:12px;',
      'border-top:1px solid var(--dsw-alias-border-l1,#eef0f4);}',
      '.nc-footerNote{flex:1;min-width:120px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#9ca3af);}',
    ].join('')

    /* ------------------------------------------------------------------ */
    /* Small pieces                                                       */
    /* ------------------------------------------------------------------ */

    const StyleTag = () => h('style', { 'data-plugin-css': 'dsh-nanny-calendar' }, CSS)

    function SegmentedType({ value, onChange, t }) {
      return h(
        'div',
        { className: 'nc-seg', role: 'tablist', 'aria-label': t('type') },
        TYPES.map((type) =>
          h(
            'button',
            {
              key: type,
              type: 'button',
              role: 'tab',
              'aria-selected': value === type,
              'data-on': value === type ? 'true' : 'false',
              className: 'nc-segBtn',
              style: { '--nc-tone': TYPE_TONE[type] || TYPE_TONE.leave },
              onClick: () => onChange(type),
            },
            t(TYPE_LABEL[type]),
          ),
        ),
      )
    }

    function RecordRow({ record, t, onEdit, onRemove }) {
      const tone = TYPE_TONE[record.type] || TYPE_TONE.leave
      const range = record.type === 'leave' && record.endDate ? record.date + ' → ' + record.endDate : record.date
      const extra =
        record.type === 'salary' && record.amount !== undefined ? '¥' + formatMoney(record.amount) : ''
      return h(
        'div',
        { className: 'nc-row', style: { '--nc-tone': tone } },
        h(
          'div',
          { className: 'nc-rowMain' },
          h(
            'div',
            { className: 'nc-rowTop' },
            h('span', { className: 'nc-rowType' }, t(TYPE_LABEL[record.type])),
            h('span', { className: 'nc-rowDate' }, extra ? range + ' · ' + extra : range),
          ),
          record.note ? h('div', { className: 'nc-rowNote', title: record.note }, record.note) : null,
        ),
        h(
          'div',
          { className: 'nc-rowActions' },
          h('button', { type: 'button', className: 'nc-iconBtn', onClick: () => onEdit(record), title: t('edit') }, t('edit')),
          h(
            'button',
            {
              type: 'button',
              className: 'nc-iconBtn nc-iconBtnDanger',
              onClick: () => onRemove(record),
              title: t('remove'),
            },
            t('remove'),
          ),
        ),
      )
    }

    /* ------------------------------------------------------------------ */
    /* Page                                                               */
    /* ------------------------------------------------------------------ */

    function NannyPage(props) {
      const t = React.useMemo(() => makeT(props && props.t), [props && props.t])
      const [data, setData] = React.useState(loadData)
      const [month, setMonth] = React.useState(() => monthOf(todayISO()))
      const [selected, setSelected] = React.useState(() => todayISO())
      const [draft, setDraft] = React.useState(() => emptyDraft(todayISO()))
      const [error, setError] = React.useState('')
      const [toast, setToast] = React.useState('')

      React.useEffect(() => {
        saveData(data)
      }, [data])

      React.useEffect(() => {
        if (!toast) return undefined
        const timer = window.setTimeout(() => setToast(''), 2200)
        return () => window.clearTimeout(timer)
      }, [toast])

      const records = data.records
      const byDay = React.useMemo(() => {
        const map = new Map()
        for (const record of records) {
          for (const day of recordDays(record)) {
            const list = map.get(day)
            if (list) list.push(record)
            else map.set(day, [record])
          }
        }
        for (const list of map.values()) list.sort((a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type))
        return map
      }, [records])

      const cells = React.useMemo(() => monthCells(month), [month])
      const summary = React.useMemo(() => monthSummary(records, month), [records, month])
      const overall = React.useMemo(() => overallSummary(records), [records])
      const monthRecords = React.useMemo(
        () => sortRecords(records.filter((record) => recordDays(record).some((day) => monthOf(day) === month))),
        [records, month],
      )
      const dayRecords = byDay.get(selected) || []
      const today = todayISO()

      /* Every cycle up to the far end of the rendered grid, plus a couple of
         cycles ahead of today so the "next payday" card always has one. */
      const allCycles = React.useMemo(() => {
        const gridTo = cells[cells.length - 1]
        const ahead = addDays(today, CYCLE_DAYS * 2)
        const horizon = gridTo > ahead ? gridTo : ahead
        return payCycles(records, horizon)
      }, [records, cells, today])

      const paidSet = React.useMemo(() => paidCycles(records, allCycles), [records, allCycles])

      /* Paydays that fall inside the rendered 6-week grid. */
      const paydayMap = React.useMemo(() => {
        const gridFrom = cells[0]
        const gridTo = cells[cells.length - 1]
        const map = new Map()
        for (const cycle of allCycles) {
          if (cycle.date >= gridFrom && cycle.date <= gridTo) map.set(cycle.date, cycle)
        }
        return map
      }, [allCycles, cells])

      const nextPay = React.useMemo(() => {
        const paid = paidCycles(records, allCycles)
        const ahead = allCycles.filter((cycle) => cycle.date >= today)
        /* Prefer the first payday that has not been settled yet. */
        return ahead.find((cycle) => !paid.has(cycle.index)) || ahead[0] || nextPayday(records, allCycles)
      }, [records, allCycles, today])

      /** A cycle counts as paid once a salary record settles it. */
      const isPaid = (cycle) => paidSet.has(cycle.index)

      const upsert = (record) => {
        setData((previous) => {
          const exists = previous.records.some((item) => item.id === record.id)
          const next = exists
            ? previous.records.map((item) => (item.id === record.id ? record : item))
            : previous.records.concat([record])
          return { ...previous, records: next }
        })
      }

      const remove = (record) => {
        if (!window.confirm(t('removeConfirm'))) return
        setData((previous) => ({ ...previous, records: previous.records.filter((item) => item.id !== record.id) }))
        setDraft((current) => (current.id === record.id ? emptyDraft(selected) : current))
      }

      const selectDay = (iso) => {
        setSelected(iso)
        setDraft((current) => (current.id ? emptyDraft(iso) : { ...current, date: iso, endDate: '' }))
        setError('')
        if (monthOf(iso) !== month) setMonth(monthOf(iso))
      }

      const startEdit = (record) => {
        setSelected(record.date)
        setMonth(monthOf(record.date))
        setDraft({
          id: record.id,
          type: record.type,
          date: record.date,
          endDate: record.endDate || '',
          amount: record.amount === undefined ? '' : String(record.amount),
          note: record.note || '',
        })
        setError('')
      }

      const save = () => {
        if (!draft.date) {
          setError(t('errDate'))
          return
        }
        if (draft.type === 'leave' && draft.endDate && draft.endDate < draft.date) {
          setError(t('errEndDate'))
          return
        }
        const record = {
          id: draft.id || newId(),
          type: draft.type,
          date: draft.date,
        }
        if (draft.type === 'leave' && draft.endDate && draft.endDate > draft.date) record.endDate = draft.endDate
        if (draft.type === 'salary') {
          const amount = Number(String(draft.amount).replace(/[,，\s]/g, ''))
          if (!Number.isFinite(amount) || amount <= 0) {
            setError(t('errAmount'))
            return
          }
          record.amount = amount
        }
        const note = String(draft.note || '').trim()
        if (note) record.note = note.slice(0, 200)
        upsert(record)
        setSelected(record.date)
        setMonth(monthOf(record.date))
        setDraft(emptyDraft(record.date))
        setError('')
        setToast(t('saved'))
      }

      const copyBackup = async () => {
        const text = JSON.stringify({ version: 1, records }, null, 2)
        try {
          await window.navigator.clipboard.writeText(text)
          setToast(t('copied'))
        } catch {
          setToast(t('copyFailed'))
        }
      }

      const restoreBackup = async () => {
        try {
          const text = await window.navigator.clipboard.readText()
          const parsed = normalizeData(JSON.parse(text))
          if (parsed.records.length === 0) {
            setToast(t('restoreFailed'))
            return
          }
          if (!window.confirm(t('restoreConfirm', { n: parsed.records.length }))) return
          setData(parsed)
          setToast(t('restored', { n: parsed.records.length }))
        } catch {
          setToast(t('restoreFailed'))
        }
      }

      const clearAll = () => {
        if (!window.confirm(t('clearAllConfirm'))) return
        setData({ version: 1, records: [] })
        setDraft(emptyDraft(selected))
      }

      const weekdayHead = h(
        'div',
        { className: 'nc-weekHead' },
        WEEKDAYS.map((key) => h('div', { key, className: 'nc-weekCell' }, t(key))),
      )

      const cellsView = h(
        'div',
        { className: 'nc-cells' },
        cells.map((iso) => {
          const dim = monthOf(iso) !== month
          const dayRecordsHere = byDay.get(iso) || []
          const shown = dayRecordsHere.slice(0, 3)
          const hidden = dayRecordsHere.length - shown.length
          const dayNumber = Number(iso.slice(8, 10))
          const isWeekend = [5, 6].indexOf((fromISO(iso).getDay() + 6) % 7) !== -1
          const payCycle = paydayMap.get(iso) || null
          return h(
            'div',
            {
              key: iso,
              className: 'nc-cell',
              'data-dim': dim ? 'true' : 'false',
              'data-selected': iso === selected ? 'true' : 'false',
              'data-payday': payCycle ? 'true' : 'false',
              onClick: () => selectDay(iso),
              role: 'gridcell',
              'aria-label': iso,
            },
            h(
              'div',
              { className: 'nc-dayHead' },
              h(
                'span',
                {
                  className: 'nc-dayNum',
                  'data-today': iso === today ? 'true' : 'false',
                  'data-weekend': isWeekend ? 'true' : 'false',
                },
                String(dayNumber),
              ),
              payCycle
                ? h(
                    'span',
                    {
                      className: 'nc-payTag',
                      'data-paid': isPaid(payCycle) ? 'true' : 'false',
                      title: t('paydayCycle', { n: payCycle.index }),
                      'aria-label': isPaid(payCycle)
                        ? t('paydayLabelPaid', { date: iso, n: payCycle.index })
                        : t('paydayLabel', { date: iso, n: payCycle.index }),
                    },
                    '¥',
                  )
                : null,
            ),
            h(
              'div',
              { className: 'nc-chips' },
              shown.map((record) =>
                h(
                  'button',
                  {
                    key: record.id,
                    type: 'button',
                    className: 'nc-chip',
                    style: { '--nc-tone': TYPE_TONE[record.type] || TYPE_TONE.leave },
                    'data-editing': draft.id === record.id ? 'true' : 'false',
                    title:
                      t(TYPE_LABEL[record.type]) +
                      (record.amount !== undefined ? ' ¥' + formatMoney(record.amount) : '') +
                      (record.note ? ' · ' + record.note : ''),
                    onClick: (event) => {
                      event.stopPropagation()
                      startEdit(record)
                    },
                  },
                  t(TYPE_LABEL[record.type]) +
                    (record.amount !== undefined ? ' ¥' + formatMoney(record.amount) : ''),
                ),
              ),
              hidden > 0 ? h('div', { className: 'nc-more' }, '+' + hidden) : null,
            ),
          )
        }),
      )

      const summaryCard = h(
        'section',
        { className: 'nc-card' },
        h('h2', { className: 'nc-cardTitle' }, h('span', { className: 'nc-cardTitleText' }, t('summary'))),
        h(
          'div',
          { className: 'nc-stats' },
          h(
            'div',
            { className: 'nc-stat' },
            h('div', { className: 'nc-statLabel' }, t('statEmployed')),
            h(
              'div',
              { className: 'nc-statValue', style: { color: TYPE_TONE.onboard } },
              String(summary.employedDays),
              h('span', { className: 'nc-statUnit' }, t('unitDay')),
            ),
          ),
          h(
            'div',
            { className: 'nc-stat' },
            h('div', { className: 'nc-statLabel' }, t('statLeave')),
            h(
              'div',
              { className: 'nc-statValue', style: { color: TYPE_TONE.leave } },
              String(summary.leaveDays),
              h('span', { className: 'nc-statUnit' }, t('unitDay')),
            ),
          ),
          h(
            'div',
            { className: 'nc-stat' },
            h('div', { className: 'nc-statLabel' }, t('statSalary')),
            h(
              'div',
              { className: 'nc-statValue', style: { color: TYPE_TONE.salary } },
              '¥' + formatMoney(summary.salaryTotal),
              summary.salaryCount > 1 ? h('span', { className: 'nc-statUnit' }, '×' + summary.salaryCount) : null,
            ),
          ),
        ),
        h(
          'div',
          { className: 'nc-miniRow' },
          h('span', { className: 'nc-dot', style: { '--nc-tone': TYPE_TONE.onboard } }),
          t('statOnboard'),
          h('strong', null, String(summary.onboardCount)),
          h('span', { className: 'nc-dot', style: { '--nc-tone': TYPE_TONE.offboard } }),
          t('statOffboard'),
          h('strong', null, String(summary.offboardCount)),
        ),
      )

      const overallCard = h(
        'section',
        { className: 'nc-card nc-overall' },
        h(
          'h2',
          { className: 'nc-cardTitle' },
          h('span', { className: 'nc-cardTitleText' }, t('overall')),
          overall.from
            ? h('span', { className: 'nc-rowDate' }, t('overallSince', { from: overall.from }))
            : null,
        ),
        overall.from === null
          ? h('div', { className: 'nc-empty' }, t('overallEmpty'))
          : h(
              'div',
              null,
              h(
                'div',
                { className: 'nc-stats nc-stats2' },
                h(
                  'div',
                  { className: 'nc-stat' },
                  h('div', { className: 'nc-statLabel' }, t('statWork')),
                  h(
                    'div',
                    { className: 'nc-statValue', style: { color: TYPE_TONE.onboard } },
                    String(overall.workDays),
                    h('span', { className: 'nc-statUnit' }, t('unitDay')),
                  ),
                ),
                h(
                  'div',
                  { className: 'nc-stat' },
                  h('div', { className: 'nc-statLabel' }, t('statLeaveTotal')),
                  h(
                    'div',
                    { className: 'nc-statValue', style: { color: TYPE_TONE.leave } },
                    String(overall.leaveDays),
                    h('span', { className: 'nc-statUnit' }, t('unitDay')),
                  ),
                ),
                h(
                  'div',
                  { className: 'nc-stat' },
                  h('div', { className: 'nc-statLabel' }, t('statEmployedTotal')),
                  h(
                    'div',
                    { className: 'nc-statValue' },
                    String(overall.employedDays),
                    h('span', { className: 'nc-statUnit' }, t('unitDay')),
                  ),
                ),
                h(
                  'div',
                  { className: 'nc-stat' },
                  h('div', { className: 'nc-statLabel' }, t('statTotalSalary')),
                  h(
                    'div',
                    { className: 'nc-statValue', style: { color: TYPE_TONE.salary } },
                    '¥' + formatMoney(overall.salaryTotal),
                    overall.salaryCount > 1
                      ? h('span', { className: 'nc-statUnit' }, '×' + overall.salaryCount)
                      : null,
                  ),
                ),
              ),
              h(
                'div',
                { className: 'nc-miniRow' },
                t('statSpan'),
                h('strong', null, overall.spanDays + t('unitDay')),
                h('span', { className: 'nc-dot', style: { '--nc-tone': TYPE_TONE.onboard } }),
                t('statOnboard'),
                h('strong', null, String(overall.onboardCount)),
                h('span', { className: 'nc-dot', style: { '--nc-tone': TYPE_TONE.offboard } }),
                t('statOffboard'),
                h('strong', null, String(overall.offboardCount)),
              ),
            ),
      )

      const paydayCard = h(
        'section',
        { className: 'nc-card nc-paydayCard' },
        h(
          'h2',
          { className: 'nc-cardTitle' },
          h('span', { className: 'nc-cardTitleText' }, t('paydayNext')),
          nextPay === null ? null : h('span', { className: 'nc-rowDate' }, nextPay.cycleFrom + ' → ' + nextPay.cycleTo),
        ),
        nextPay === null
          ? h('div', { className: 'nc-empty' }, t('paydayEmpty'))
          : h(
              'div',
              null,
              h(
                'div',
                { className: 'nc-payRow' },
                h('span', { className: 'nc-payDate' }, nextPay.date),
                h(
                  'span',
                  { className: 'nc-payWhen', 'data-today': nextPay.date === today ? 'true' : 'false' },
                  nextPay.date === today ? t('paydayToday') : t('paydayInDays', { n: dayCount(today, nextPay.date) - 1 }),
                ),
              ),
              h(
                'div',
                { className: 'nc-miniRow' },
                h('span', { className: 'nc-dot', style: { '--nc-tone': TYPE_TONE.salary } }),
                t('paydayCycle', { n: nextPay.index }),
              ),
              h('div', { className: 'nc-hint nc-payRule' }, t('paydayRule')),
            ),
      )

      const dayCard = h(
        'section',
        { className: 'nc-card' },
        h(
          'h2',
          { className: 'nc-cardTitle' },
          h('span', { className: 'nc-cardTitleText' }, t('selectedDay')),
          h('span', { className: 'nc-rowDate' }, selected),
        ),
        dayRecords.length === 0
          ? h('div', { className: 'nc-empty' }, t('noRecordToday'))
          : h(
              'div',
              { className: 'nc-list' },
              dayRecords.map((record) =>
                h(RecordRow, { key: record.id, record, t, onEdit: startEdit, onRemove: remove }),
              ),
            ),
      )

      const formCard = h(
        'section',
        { className: 'nc-card' },
        h(
          'h2',
          { className: 'nc-cardTitle' },
          h('span', { className: 'nc-cardTitleText' }, draft.id ? t('editRecord') : t('addRecord')),
        ),
        h(
          'div',
          { className: 'nc-form' },
          h(SegmentedType, {
            value: draft.type,
            t,
            onChange: (type) => {
              setDraft((current) => ({ ...current, type }))
              setError('')
            },
          }),
          h(
            'div',
            { className: 'nc-field' },
            h('span', { className: 'nc-fieldLabel' }, t('date')),
            h('input', {
              className: 'nc-input',
              type: 'date',
              value: draft.date,
              onChange: (event) => setDraft((current) => ({ ...current, date: event.target.value })),
            }),
          ),
          draft.type === 'leave'
            ? h(
                'div',
                { className: 'nc-field' },
                h('span', { className: 'nc-fieldLabel' }, t('endDate')),
                h('input', {
                  className: 'nc-input',
                  type: 'date',
                  value: draft.endDate,
                  min: draft.date,
                  onChange: (event) => setDraft((current) => ({ ...current, endDate: event.target.value })),
                }),
                h('span', { className: 'nc-hint' }, t('endDateHint')),
              )
            : null,
          draft.type === 'salary'
            ? h(
                'div',
                { className: 'nc-field' },
                h('span', { className: 'nc-fieldLabel' }, t('amount')),
                h('input', {
                  className: 'nc-input',
                  type: 'text',
                  inputMode: 'decimal',
                  placeholder: t('amountPlaceholder'),
                  value: draft.amount,
                  onChange: (event) => setDraft((current) => ({ ...current, amount: event.target.value })),
                }),
              )
            : null,
          h(
            'div',
            { className: 'nc-field' },
            h('span', { className: 'nc-fieldLabel' }, t('note')),
            h('input', {
              className: 'nc-input',
              type: 'text',
              maxLength: 200,
              placeholder: t('notePlaceholder'),
              value: draft.note,
              onChange: (event) => setDraft((current) => ({ ...current, note: event.target.value })),
            }),
          ),
          error ? h('div', { className: 'nc-error' }, error) : null,
          h(
            'div',
            { className: 'nc-formActions' },
            draft.id
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'nc-btn',
                    onClick: () => {
                      setDraft(emptyDraft(selected))
                      setError('')
                    },
                  },
                  t('cancel'),
                )
              : null,
            h('button', { type: 'button', className: 'nc-btn nc-btnPrimary', onClick: save }, t('save')),
          ),
        ),
      )

      const monthListCard = h(
        'section',
        { className: 'nc-card' },
        h(
          'h2',
          { className: 'nc-cardTitle' },
          h('span', { className: 'nc-cardTitleText' }, t('recordsOfMonth')),
          h('span', { className: 'nc-rowDate' }, t('recordsCount', { n: monthRecords.length })),
        ),
        monthRecords.length === 0
          ? h('div', { className: 'nc-empty' }, t('noRecordMonth'))
          : h(
              'div',
              { className: 'nc-list' },
              monthRecords.map((record) =>
                h(RecordRow, { key: record.id, record, t, onEdit: startEdit, onRemove: remove }),
              ),
            ),
      )

      const footer = h(
        'div',
        { className: 'nc-footer' },
        h('span', { className: 'nc-footerNote' }, toast || ''),
        h('button', { type: 'button', className: 'nc-btn nc-btnGhost', onClick: copyBackup }, t('copyBackup')),
        h('button', { type: 'button', className: 'nc-btn nc-btnGhost', onClick: restoreBackup }, t('restoreBackup')),
        h('button', { type: 'button', className: 'nc-btn nc-btnGhost nc-btnDanger', onClick: clearAll }, t('clearAll')),
      )

      return h(
        'div',
        { className: 'nc-root' },
        h(StyleTag, null),
        h(
          'div',
          { className: 'nc-scroll' },
          h(
            'div',
            { className: 'nc-wrap' },
            h(
              'header',
              { className: 'nc-head' },
              h(
                'div',
                { className: 'nc-headText' },
                h('h1', { className: 'nc-title' }, t('pageTitle')),
                h('p', { className: 'nc-subtitle' }, t('pageSubtitle')),
              ),
              h(
                'div',
                { className: 'nc-nav' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'nc-btn nc-btnIcon',
                    title: t('prevMonth'),
                    'aria-label': t('prevMonth'),
                    onClick: () => setMonth(addMonths(month, -1)),
                  },
                  '‹',
                ),
                h('span', { className: 'nc-monthLabel' }, monthLabel(month, t)),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'nc-btn nc-btnIcon',
                    title: t('nextMonth'),
                    'aria-label': t('nextMonth'),
                    onClick: () => setMonth(addMonths(month, 1)),
                  },
                  '›',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'nc-btn',
                    onClick: () => {
                      const now = todayISO()
                      setMonth(monthOf(now))
                      setSelected(now)
                      setDraft(emptyDraft(now))
                    },
                  },
                  t('today'),
                ),
              ),
            ),
            h(
              'div',
              { className: 'nc-grid' },
              h(
                'div',
                null,
                h('div', { className: 'nc-calendar', role: 'grid' }, weekdayHead, cellsView),
              ),
              h('div', { className: 'nc-side' }, summaryCard, paydayCard, overallCard, formCard, dayCard, monthListCard),
            ),
            footer,
          ),
        ),
      )
    }

    /* ------------------------------------------------------------------ */
    /* Sidebar icon                                                       */
    /* ------------------------------------------------------------------ */

    function CalendarIcon(ownerProps) {
      const size = (ownerProps && ownerProps.size) || 16
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('rect', { x: 3, y: 5, width: 18, height: 16, rx: 3.2 }),
        h('path', { d: 'M8 3v4M16 3v4M3.4 10h17.2' }),
        h('circle', { cx: 8.4, cy: 14.4, r: 1.15, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 12, cy: 14.4, r: 1.15, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 15.6, cy: 18, r: 1.15, fill: 'currentColor', stroke: 'none' }),
      )
    }

    /* ------------------------------------------------------------------ */
    /* Plugin                                                             */
    /* ------------------------------------------------------------------ */

    function apply(ctx) {
      let t = null

      ctx.inject(['locale'], (scoped) => {
        scoped.effect(() => scoped.locale.register(NS, 'zh', DICT.zh), 'nanny-calendar: zh dictionary')
        scoped.effect(() => scoped.locale.register(NS, 'en', DICT.en), 'nanny-calendar: en dictionary')
        t = scoped.locale.bind(NS)
      })

      const translate = (key, params) => {
        if (t !== null) {
          try {
            const text = t(key, params)
            if (typeof text === 'string' && text !== key) return text
          } catch {
            /* fall through to the built-in dictionary */
          }
        }
        return fallbackT(key, params)
      }

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            label: () => translate('nav'),
            locale: NS,
          },
          CalendarIcon,
        ),
      )

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ t: translate }),
          },
          NannyPage,
        ),
      )
    }

    return {
      name: 'dsh-nanny-calendar',
      inject: ['slots'],
      apply,
    }
  },
})
