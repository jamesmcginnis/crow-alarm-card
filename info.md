# 🛡️ Crow Alarm Card

A liquid-glass [Home Assistant](https://www.home-assistant.io/) card for `alarm_control_panel` entities. It has three layouts (Dial, Pill and Tile), arm and disarm buttons you choose yourself, an optional PIN pad, light and dark themes with an adjustable glass effect, and optional AI features (Insight, Ask AI, What happened? and This week). You can set everything up without writing any YAML.

---

> ✨ **AI features are optional.** Nothing AI-powered runs until you turn on AI features and choose a conversation agent in the editor (see [AI Features Setup](#-ai-features-setup-optional) below). Without an agent, the card works fully as an alarm panel, and none of the core features depend on AI.

---

## ✨ Features

### Alarm control
- **Arm and disarm buttons.** Choose which of Home, Away, Night, Vacation and Custom Bypass appear. **Off** always appears. The active mode is highlighted.
- **Only supported modes are shown.** If your alarm integration reports `supported_features`, which most do, buttons for modes it can't do are hidden automatically.
- **Live status.** The panel name and current state are shown, and while armed you also see how long it has been armed, e.g. "Armed Away · 2h 15m ago".
- **Every alarm state is covered**: Disarmed, Armed Home, Away, Night, Vacation and Bypass, Pending, Arming, Disarming, Triggered, Unavailable and Unknown. Buttons are disabled while the panel is offline.

### Security
- **Optional PIN pad** before arming, before disarming, or both. It opens as a sheet that slides up from the bottom on phones and sits centred on larger screens, with the action you're confirming (e.g. "Arm Away") shown large in its state colour. The code you type is sent straight to your alarm integration, which does the checking. If it's rejected, the dots shake and you can try again. On a computer you can type the code on your keyboard and press Enter.
- **Two PIN pad styles**: **Rounded**, with soft square keys and a full-width action button, or **Round**, with circular ringed keys and a round action button labelled underneath. Choose one in the editor's Security section.
- **Numeric or text codes.** The keypad switches to a password field automatically if your integration uses a text code.
- **Stored code (optional).** You can save a code in the card config and it will be sent with every button press. See the [security note](#-security) before using this.

### Layouts
| Layout | Shape | Best for |
|---|---|---|
| **Dial** | Square, labelled button grid | A main alarm panel |
| **Pill** | One row, icon buttons | Headers and narrow columns |
| **Tile** | Compact 2:1 widget | Sections-view grids |

All three work with the sections view's grid sizing. In the Pill and Tile layouts, the name and state hide automatically when the card is too narrow to read them (for example a 1×6 Pill), and the buttons spread out to fill the space.

### Appearance
- **Liquid-glass design** with a **Glass** slider that runs from clear to frosted.
- **Theme**: Auto (follows Home Assistant), Light or Dark.
- **Size**: Compact, or Regular (about 20% larger).
- **State colours** for Disarmed, Armed, Pending/Arming and Triggered. These are adjusted automatically so they stay readable in both light and dark themes, and each one has a light and dark preview swatch.
- **Colour presets**: Classic, Ocean, Warm and Graphite. Pick one with a single tap, then fine-tune any colour.
- **Animations**: Off; Subtle, which animates only the pending and triggered states; or System, which is Subtle but stays still if your device's Reduce Motion setting is on.

### AI features (optional)
Needs a Home Assistant conversation agent. When AI is on, tap the alarm icon, tap the card away from the arm buttons, or long-press the card to open the **actions sheet**:
- **Insight**: what the current state means, taking the time of day and the last week into account, with a sensible next step.
- **Ask AI**: suggested questions such as "What should I check before arming away?", or type your own.
- **What happened?**: the last 24 hours as a colour-coded timeline of every state change and how long it lasted, with any triggers or offline spells called out, plus a short summary.
- **This week**: times armed, total time armed (and the percentage of the week), times triggered, and the most-used mode, with a short summary.

Each feature has its own toggle in the editor. The assistant only sees this alarm's name, its state, its recorder history and the local time. It is told never to arm or disarm on its own, because that decision is always yours. Nothing is sent until you open a sheet, and answers are cached.

---

## Configuration

Add the card from the card picker and it picks your first alarm panel automatically. Everything else is set in the built-in visual editor, so you don't need any YAML. The README has the full list of YAML options.

---

## 🔒 Security

- **The PIN pad is the safer option.** The code you type is sent to your alarm integration, which checks it. Nothing is stored in the card.
- **A stored `code` is saved in plain text in your dashboard config.** Anyone who can view or edit that dashboard's configuration can read it, and every button press will then work without a code. Only use it on dashboards you fully control. For the disarm button in particular, prefer **Require code to disarm**.
- The AI features never see your code and can't arm or disarm anything. They only read the state and its history.

---

## 🤖 AI Features Setup (Optional)

AI features stay off until you turn them on and choose a conversation agent. **Google Gemini** is the recommended and best-tested agent:

### Step 1 — Enable the Generative Language API

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in
2. Create a new project (or select an existing one)
3. Go to **APIs & Services → Library**
4. Search for **Generative Language API** and click **Enable**

> ⚠️ Don't skip this step. An API key won't work until the Generative Language API is enabled; it will return errors straight away.

### Step 2 — Create an API Key

1. In Google Cloud Console go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API key** and copy the key

### Step 3 — Add Google Generative AI to Home Assistant

1. In Home Assistant go to **Settings → Devices & Services → + Add Integration**
2. Search for **Google Generative AI** and select it
3. Paste your API key and click Submit
4. The recommended model settings work fine. If you choose a model yourself, pick a **current Flash model**, because Google retires older models regularly (`gemini-2.0-flash` was shut down in June 2026).

### Step 4 — Configure the Card

In the card's visual editor, open **AI Features**, turn on **Enable AI features**, and choose your Google AI agent under **Conversation agent**.

### Rate limits

Free-tier limits vary by model and change over time, so check Google AI Studio for your current quota. The card only calls the agent when you open an AI sheet or ask a question, and it caches answers, so you're unlikely to reach the limit in normal use. If you do see a quota message, it resets the next day.

---

## 🧩 Supported Integrations

Works with any integration that provides an `alarm_control_panel` entity, including built-in Home Assistant integrations such as Manual Alarm, Ring, SimpliSafe, Abode, Risco, Envisalink and Total Connect.

### Supported States

`disarmed` · `armed_home` · `armed_away` · `armed_night` · `armed_vacation` · `armed_custom_bypass` · `pending` · `arming` · `disarming` · `triggered`
