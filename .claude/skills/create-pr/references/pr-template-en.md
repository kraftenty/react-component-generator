# PR Template (English)

Use for English-language projects, including international open source. Fill in every section; write "N/A" where nothing applies.

## Title rules

- Format: `<type>: <summary>` (use the repository's convention, e.g. `feat`, `fix`, `refactor`, `chore`)
- Imperative mood, 70 characters or fewer, no trailing period
- Good: `feat: add 500-character limit validation for prompts`
- Bad: `Fixed some stuff.`

## Body template

```markdown
## Summary

<What this PR does and why, in 1-3 sentences. Focus on motivation and context.>

## Changes

- <Key change 1>
- <Key change 2>

## Type of change

- [ ] Feature (feat)
- [ ] Bug fix (fix)
- [ ] Refactor (refactor)
- [ ] Config / docs / other (chore)

## Testing

- [ ] Added or updated unit tests
- [ ] Tests pass locally
- [ ] Verified manually

<List the commands you ran and the scenarios you checked. If you did not run tests, say "Not run".>

## Notes for reviewers

<Areas that deserve extra attention, trade-offs, open questions. "N/A" if none.>

## Related issues

<Closes #number. "N/A" if none.>

## Screenshots

<Before/after for UI changes. "N/A" if none.>
```

## Writing guidelines

- Describe behavior changes, not a file-by-file list.
- Check a box only when it is true and you actually verified it.
- If the change is breaking, state it right below the summary in a line starting with `**Breaking:**`.
- Follow the repository's CONTRIBUTING guide when it asks for more (e.g. DCO sign-off, changelog entry).
