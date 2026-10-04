# Real or Scam? A lesson concept

This is a mock Duolingo-style lesson built for the "New World Character: Lesson Concept" assignment in a USC Iovine and Young Academy class. It introduces **Biscuit**, a golden retriever who trusts everyone, and teaches beginners how to spot scam texts in a 10-question lesson.

It is a student concept and is not affiliated with or endorsed by Duolingo. It uses no Duolingo logos, characters, fonts, or sounds.

Live: https://appiest.github.io/duolingo-if/

## Run it locally

The page loads `lesson.json` with `fetch`, and browsers block that for files opened straight from disk. Double-clicking `index.html` will show a "The lesson didn't load" message. Start a small local server instead:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

There is no build step. The page is plain HTML, CSS, and JavaScript modules:

| File | What it does |
| --- | --- |
| `index.html` | The page shell, which loads Nunito from Google Fonts |
| `styles.css` | All styling. Colors, radii, and the column width are tokens at the top. |
| `app.js` | The lesson engine: intro, question flow, scoring, Q10 choice, and the complete screen |
| `exercises.js` | One render function per exercise type |
| `sounds.js` | Correct, incorrect, and complete sounds synthesized with WebAudio |
| `lesson.json` | Every word the learner reads in the lesson |
| `assets/characters/` | Biscuit's five poses |

## Edit the lesson

All lesson text lives in `lesson.json`, so you can change wording without touching code. Save the file and refresh the page.

- `lesson` holds the title, unit, character, intro, outro, and the four scam `signs`.
- `questions` holds questions 1 to 9, shown in order.
- `q10` holds the final question. If the learner missed anything in 1 to 9, they get the replay under `q10.replays` whose key matches the `concept` of the **first** question they missed. A perfect run gets `q10.boss` instead.

Every question has `id`, `type`, `concept`, `prompt`, and `feedback`:

```json
"feedback": {
  "correct": { "pose": "happy", "text": "You caught it!" },
  "incorrect": { "pose": "sad", "text": "That's a scam." }
}
```

`pose` is one of the keys under `lesson.character.poses`. If an answer option has its own `feedback` string, the incorrect sheet shows that string instead of the generic `incorrect.text`.

A question can also include `context`, a small card shown above the phone. `emoji` is optional:

```json
"context": { "emoji": "📦", "label": "Biscuit's order", "text": "1x Squeaky Duck Chew Toy, shipped" }
```

Messages use `sender` and `text`. Anything that looks like a web address (ending in `.com`, `.net`, `.info`, `.co`, and so on) is styled as a link but can't be clicked.

### `real-or-scam`

Shows a text message with Real and Scam buttons. `answer` is `"real"` or `"scam"`.

```json
{
  "type": "real-or-scam",
  "prompt": "Real or scam?",
  "message": { "sender": "FasTrak", "text": "Pay by today: fastrak-tollpay.com" },
  "answer": "scam"
}
```

### `tap-text`

The message is split into `segments` that the learner taps. The answer is correct only when the selected set exactly matches `correctSegments`. Set `"multi": true` to allow more than one pick. With `multi`, segments that have a `tag` (`pretend`, `problem`, `pressure`, or `pay`) get a label from `lesson.signs` after checking. `newWord` is optional and adds a tappable definition under the prompt.

```json
{
  "type": "tap-text",
  "prompt": "Tap the part that's trying to rush you.",
  "message": {
    "sender": "FasTrak",
    "segments": [
      { "id": "s1", "text": "You owe $4.15." },
      { "id": "s2", "text": " Pay by today", "tag": "pressure" }
    ]
  },
  "correctSegments": ["s2"],
  "newWord": { "word": "Pressure", "definition": "A tight deadline meant to rush you." }
}
```

Start a segment with a space when it follows another segment mid-sentence.

### `match-pairs`

Two shuffled columns. The `hint` appears when someone taps the info button on a right-hand label or long-presses it. The question finishes by itself once every pair is matched, and it counts as correct only if there were no wrong matches.

```json
{
  "type": "match-pairs",
  "prompt": "Tap the matching pairs.",
  "pairs": [
    { "left": "\"Respond within 1 hour\"", "right": "Pressure", "hint": "Rushes you" }
  ]
}
```

### `chat-reply`

The learner picks a reply, and it appears in the conversation after checking. `answer` is an option `id`.

```json
{
  "type": "chat-reply",
  "prompt": "What should Biscuit reply?",
  "message": { "sender": "Golden Bank", "text": "Reply with the code we sent." },
  "options": [
    { "id": "a", "text": "Sure! It's 482910", "feedback": "A real bank never asks for that code." },
    { "id": "b", "text": "I'll call the number on my card instead." }
  ],
  "answer": "b"
}
```

### `word-bank`

A sentence builder. `answer` is the words in order. `tiles` is every tile shown, including extra distractor tiles.

```json
{
  "type": "word-bank",
  "prompt": "Build Biscuit's new rule.",
  "answer": ["Never", "share", "a", "code"],
  "tiles": ["code", "a", "Never", "share", "always"]
}
```

### `image-choice`

Three big cards, each with an `emoji` and a `label`. `message` is optional.

```json
{
  "type": "image-choice",
  "prompt": "What should Biscuit do?",
  "options": [
    { "id": "a", "emoji": "🔗", "label": "Tap the link", "feedback": "That link goes to the scammer." },
    { "id": "b", "emoji": "📲", "label": "Open the USPS app himself" }
  ],
  "answer": "b"
}
```

### `multiple-choice`

A numbered list of options. `message` is optional.

```json
{
  "type": "multiple-choice",
  "prompt": "What's the best next move?",
  "options": [
    { "id": "a", "text": "Forward it to 7726 (SPAM), then delete it" },
    { "id": "b", "text": "Text back \"nice try\"", "feedback": "Any reply tells the scammer your number works." }
  ],
  "answer": "a"
}
```

## Swap Biscuit's art

The code never draws Biscuit itself. Every image comes from the paths in `lesson.character.poses`:

```
assets/characters/biscuit-idle.svg
assets/characters/biscuit-happy.svg
assets/characters/biscuit-sad.svg
assets/characters/biscuit-shocked.svg
assets/characters/biscuit-celebrate.svg
```

You can swap the art in either of two ways:

- Replace those five files with your own art and keep the same names.
- Put your files anywhere in the folder, such as `assets/characters/biscuit-happy.png`, and update the matching paths in `lesson.json`.

Use square images with transparent backgrounds. The lesson shows them at about 110px and the intro and complete screens show them at 180px, so export at 400px or larger for sharp phone screens. Keep paths relative, with no leading `/`, because the site is served from the `/duolingo-if/` subfolder.

## Controls

- Number keys pick an option. In match-pairs, the left column is numbered first, then the right. In word-bank, the numbers follow the tile bank in order.
- Enter checks the answer, and Enter again continues.
- The speaker button in the top bar turns sound effects on and off.
- If the device is set to reduce motion, the lesson turns off the shake, hop, and confetti animations.
