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
| `intro-chat.js` | The animated text conversation that plays before the lesson |
| `sounds.js` | Sound effects and voice playback. Every sound can come from a file or fall back to a synthesized version. |
| `tools/record_voices.py` | Opens a page for recording every voice line into `assets/voice/` |
| `lesson.json` | Every word the learner reads in the lesson |
| `assets/characters/` | Biscuit's five poses |

## Edit the lesson

All lesson text lives in `lesson.json`, so you can change wording without touching code. Save the file and refresh the page.

- `lesson` holds the title, unit, character, intro, intro chat, outro, the four scam `signs`, sound files, and feedback headings.
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

Two shuffled columns. The `hint` appears when someone taps the info button on a right-hand label or long-presses it. A wrong pair flashes red and buzzes right away. The question finishes by itself once every pair is matched and always counts as correct, the way Duolingo does it.

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

A sentence builder. `answer` is the words in order. `tiles` is every tile shown, including extra distractor tiles. `acceptedAnswers` is optional and lists other word orders that also count as fully correct.

Judging is forgiving for young learners. If the sentence is right except for one extra tile dropped in, it counts as correct with an "Almost!" note that names the extra word. A missing word or a swapped word, such as "always" in place of "Never", still counts as wrong because it can change the meaning.

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

## Intro chat

After "Let's find out", Biscuit texts a friend about the toll text, and the friend explains what scam texts are. It lives under `lesson.introChat`:

```json
"introChat": {
  "friend": { "name": "Duo", "image": "assets/characters/friend-placeholder.svg" },
  "button": "Start lesson",
  "messages": [
    { "from": "biscuit", "pose": "shocked", "text": "Help!! I got this text.", "forwarded": { "sender": "FasTrak", "text": "..." } },
    { "from": "friend", "text": "Stop! Don't tap that link." }
  ]
}
```

- `from` is `"biscuit"` or `"friend"`. Biscuit's messages can set his `pose`.
- `forwarded` is optional and shows a quoted text inside the message.
- `source` is optional and is never shown. Use it to note where a fact came from. The $470 million line cites the [FTC's April 2025 Data Spotlight](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2025/04/top-text-scams-2024).
- The last message turns into the `button` that starts the lesson.

The friend is Duo. `friend.image` still points to a gray placeholder, so drop Duolingo's official Duo artwork into the folder and point `friend.image` at it.

Each message waits for its voice clip, or for enough reading time if sound is off, whichever is longer. Tapping the chat jumps to the next message, and "Skip intro" goes straight to the lesson.

## Teaching chats

`lesson.teachChats` holds chats that play in the middle of the lesson, right before the question named in `before`. They teach something new before the learner practices it. They don't count as one of the 10 steps, so the progress bar doesn't move.

The 4 P's chat plays before Q3. It works like the intro chat, plus two extras:

- `example` is a text pinned above the chat, split into `segments`. Segments with a `tag` (`pretend`, `problem`, `pressure`, or `pay`) can light up.
- In a message, `"showExample": true` reveals the pinned text, `"highlight": "pressure"` lights up that P's part with its label, and `"highlight": "all"` pulses every label at once.

Each P keeps one color everywhere it appears, in the chat and in Q9's labels. The colors are defined once in `styles.css` as `--p-pretend`, `--p-problem`, `--p-pressure`, and `--p-pay`.

Q3's examples are deliberately different from the chat's, so learners apply the P's instead of copying the answer they just saw.

## Voice

Three voices speak in the lesson:

- **The main character** reads the start and end screen lines, every feedback line, and their half of the intro chat.
- **Duo** reads the other half of the intro chat.
- **The narrator** reads each question's prompt when it appears, and the feedback heading ("Great job!", "Not quite", "Almost!", "5 in a row!") just before the character's feedback line. The speaker button in the prompt bubble replays the prompt.

The team records every line in a browser page. On a Mac with ffmpeg installed (`brew install ffmpeg`), run:

```sh
python3 tools/record_voices.py
```

That opens http://localhost:8800/tools/recorder/. Each line shows who says it, where it plays, and how the character feels in that moment.

- Press Space to start recording and Space again to stop.
- Your take plays back right away, and P plays it again.
- Use the arrow keys to move between lines. "Still to record" shows only the lines left to do.
- Recording a line again replaces the old take.

Each take is trimmed, leveled, and saved straight into `assets/voice/`. `assets/voice/manifest.json` updates too, so http://localhost:8800/ plays the lesson with your recordings right away. Commit `assets/voice/` to publish them. A line without a recording plays silently, and the intro chat gives it reading time instead.

When you change a spoken line in `lesson.json`, it shows up in the recorder as not recorded yet, because a take belongs to its exact wording.

## Character name

`{name}` in any line of `lesson.json` is replaced with `lesson.character.name`. To rename the main character, change that one field. The jokes still assume a dog ("I'm a dog", "dog treats", "my paw", "my food bowl"), so rewrite those if your character isn't one.

## Feedback headings

`lesson.ui` holds the feedback headings. `praise` rotates on correct answers, `incorrect` and `almost` cover the other outcomes, and `combo` replaces praise when the learner reaches a number in `comboMilestones` in a row. `{count}` is filled in with that number. Record any heading you change in the recorder.

## Sounds

`lesson.sounds` has a slot for each sound effect: `tap`, `correct`, `incorrect`, `match`, `combo`, `message`, and `complete`. An empty slot uses the built-in synthesized sound. To use a recorded sound, put the file in the folder and add its path:

```json
"sounds": { "correct": "assets/sounds/correct.mp3" }
```

The `combo` sound plays at each number in `ui.comboMilestones`.

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
- The speaker button in the top bar turns sound effects and voices on and off. The speaker in Biscuit's intro speech bubble plays that line.
- If the device is set to reduce motion, the lesson turns off the shake, hop, and confetti animations.
