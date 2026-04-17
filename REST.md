Adventurers can take short rests in the midst of an adventuring day and a long rest to end the day.

# Short Rest (1hr+)

- Healing -> Characters can spend one or more Hit Dice (up to their total level) to regain hit points. For each die, roll it and add the Constitution modifier, regaining that total. Works for unconscious charaters.
- Resource Recovery -> usage with type 'short_rest' | 'per_rest'
- Rest actions (Traits or Features) -> onRest with type 'short_rest'
- Spell Slots -> all for warlock + some for druid feature

# Long Rest (8hr+)

- The character must have at least 1 hit point at the start.
- Healing (Full) -> All lost hit points are regained
- Resource Recovery -> usage with type 'long_rest' | 'per_rest' | 'per_day' | 'per_week' | 'per_month'
- Hit Dice Recovery: Spent Hit Dice equal to half their total maximum (minimum of one)
- Exhaustion: Reduces exhaustion level by 1
- Rest actions (Traits or Features) -> onRest with type 'long_rest'
- Spell Slots -> All + Temporary spells?

# TODO

- [] Side Effects Prep
  - [ ] Add partial regain spell slots
  - [ ] Add Status Effect UI
- [ ] Add Rest UI
  - Clear and clear all should handle rest
    - Inactive flag for each that was rested? (Trait & Feature usage and Spell slots)
    - Active filter in action records
  - Short rest
  - Long rest
