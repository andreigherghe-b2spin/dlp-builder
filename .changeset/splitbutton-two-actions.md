---
"@ui/web": minor
---

feat(splitbutton): add `SplitButton`, a labelled action with a second action beside it

New atom for Figma's `Split button` (node 3188:191) — the shape the brand apps' `Pill`
had, but with the icon promoted from decoration to a real control. It reads as one
button and behaves as two: the label opens the thing, the icon beside it dismisses it,
and the two hover, press, focus and disable independently, which is the whole reason it
is not a `Button` with an icon in it.

That separation is not implemented so much as inherited. Each half is a real `<button>`
dressed by `buttonVariants`, so its states are the element's own `:hover`, `:active` and
`:focus-visible` and all six variants plus the disabled repaint arrive unchanged — there
is no state prop and nothing to keep in sync. Figma's `Hover Left` / `Hover Right` pair
and its per-segment focus ring come out of the markup for free.

**It is an atom**: it renders no other component of the kit. Borrowing a class builder is
not rendering, the same way `Badge` and `Label` borrow the type scale.

**The design is now 1:1 with `Button`.** The same five sizes by the same names, the same
heights (24 / 32 / 40 / 48 / 56), the same `Label` type at `lineHeight: 1`, the same
glyph sizes and the same radius — so none of them are restated here. Exactly two things
are the component's own: the seam, which is the left half's dropped right border, and the
left half's padding, which Figma keeps tighter than a whole button's (8 / 12 / 12 / 12 /
16 against Button's 12 / 12 / 16 / 20 / 24). The right half is square at every step,
straight off `Button`'s `icon` shape.

**One component, two slots.** `variant`, `size` and `disabled` describe the control and
go on the root; anything belonging to one half goes in `slotProps`, which takes a
`<button>`'s own prop surface minus `children` — handlers, `disabled`, a `className`, a
`data-testid`. The label's slot also takes `asChild`, which is how the label becomes a
link and the porting path for a `Pill`.

```tsx
<SplitButton
  actionLabel="Remove game"
  variant="secondary"
  slotProps={{ label: { onClick: open }, action: { onClick: remove } }}
>
  Game name
</SplitButton>
```

`actionLabel` is required rather than defaulted: the icon half has no name from its
content and the glyph is swappable, so an English default would be wrong twice over.

Ships at `status:needs-review`: engineering-complete, unit-tested, and photographed by
the visual suite in all five themes — awaiting a designer's sign-off against Figma.

Two things worth raising with the design owner: the component description still says `xs`
and `xl` are "intentionally not included" and still promises a `State=Loading`, but the
variant set has all five sizes and no loading state. The description is stale; the
variants were taken as the spec, and no `isLoading` prop ships.
