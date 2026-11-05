// Each round has two passages; `aiIs` says which one ("A" or "B") was AI generated.
// All passages are fictional, written for this exhibit.
export const HUMAN_OR_AI_ROUNDS = [
  {
    type: 'Product description',
    a: "It's a water bottle. Keeps drinks cold for about a day, hot for a few hours. The lid leaks a little if you don't screw it down tight, so don't toss it in your bag open.",
    b: 'Introducing the AquaPeak Bottle: your ultimate hydration companion! Crafted with premium double-wall insulation, it seamlessly keeps beverages refreshingly cold for 24 hours, elevating every adventure.',
    aiIs: 'B',
    explanation: 'The AI version uses polished marketing phrases ("ultimate", "seamlessly", "elevating") and never mentions a flaw. The human wrote plainly and admitted the lid leaks.',
  },
  {
    type: 'Short story',
    a: 'The old lighthouse hummed with quiet resilience as Mara climbed its spiral stairs. Each step echoed a story of courage, and in the glow of the lamp, she realized that light was a promise the sea could never take away.',
    b: "Mara hated the lighthouse stairs. 112 of them, and the 87th always creaked like it was complaining. She counted anyway, because counting was easier than thinking about why her dad had stopped coming up here.",
    aiIs: 'A',
    explanation: 'The AI version leans on tidy metaphors and a neat moral ending. The human version uses a specific odd detail (the 87th step) and leaves emotion unsaid.',
  },
  {
    type: 'Python code',
    a: 'def average(numbers):\n    """Calculate the average of a list of numbers.\n\n    Args:\n        numbers: A list of numeric values.\n\n    Returns:\n        The arithmetic mean, or 0 if the list is empty.\n    """\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)',
    b: 'def avg(l):\n    # TODO fix empty list later\n    t = 0\n    for x in l:\n        t += x\n    return t / len(l)',
    aiIs: 'A',
    explanation: 'The AI-style code is tidy, fully documented and handles the empty case. The human code has a TODO, short names and a known bug. Careful people write tidy code too, so this is only a clue.',
  },
  {
    type: 'Resume statement',
    a: 'Results-driven professional with a proven track record of leveraging cross-functional synergies to deliver impactful, scalable solutions in dynamic environments.',
    b: 'I fixed our team\u2019s weekly report so it takes 10 minutes instead of 3 hours. I also run the Tuesday coding club for first-years.',
    aiIs: 'A',
    explanation: 'The AI-style statement is full of buzzwords and has no concrete facts. The human statement gives specific numbers and activities.',
  },
  {
    type: 'Social media post',
    a: "just burned toast AGAIN and the smoke alarm is now yelling at me like I owe it money. send help (and a better toaster)",
    b: 'Mornings are a chance to start fresh! \u2615 Today, I\u2019m grateful for the little moments that make life special. What are you grateful for today? #Gratitude #MorningVibes #Mindset',
    aiIs: 'B',
    explanation: 'The AI-style post is upbeat, generic and ends with a question and hashtags. The human post has a specific funny moment and casual voice.',
  },
]
