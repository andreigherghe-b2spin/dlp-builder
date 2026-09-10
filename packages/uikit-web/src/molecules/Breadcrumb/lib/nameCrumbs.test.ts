import { describe, expect, it } from "vitest";

import type { BreadcrumbCrumb } from "@/molecules/Breadcrumb/lib/collapseCrumbs";
import { nameCrumbs } from "@/molecules/Breadcrumb/lib/nameCrumbs";

/** The names in trail order, which is what a key and a test id are read as. */
const names = (crumbs: BreadcrumbCrumb[]) => nameCrumbs(crumbs).map((crumb) => crumb.name);

describe("naming a crumb after where it goes", () => {
  it("names each kind of href, and the crumb with none `page`", () => {
    expect(
      names([
        { label: "a", href: "/" },
        { label: "b", href: "/slots/megaways" },
        { label: "c", href: "/Slots?page=2" },
        { label: "d", href: "/games/slots_&_bingo#terms" },
        { label: "e" },
      ]),
    ).toEqual(["root", "slots-megaways", "slots", "games-slots-bingo", "page"]);
  });
});

describe("keeping names unique", () => {
  it("suffixes a repeat rather than letting two crumbs share a key", () => {
    expect(
      names([{ label: "a", href: "/" }, { label: "b" }, { label: "c", href: "/" }, { label: "d" }]),
    ).toEqual(["root", "page", "root-2", "page-2"]);
  });

  it("keeps the two positions apart when the trail repeats one crumb object", () => {
    // The bug a name-per-position replaced: keyed on the crumb, the second
    // `home` overwrote the first and both rendered under one key and one test
    // id — which is the collision the suffixing exists to stop.
    const home: BreadcrumbCrumb = { label: "Home", href: "/" };

    expect(names([home, { label: "b", href: "/slots" }, home])).toEqual([
      "root",
      "slots",
      "root-2",
    ]);
  });

  it("does not hand a suffix to a crumb that legitimately owns it", () => {
    // `/slots/2` is `slots-2` in its own right, which is also what a second
    // `/slots` would want — the first to ask keeps it and the other moves on.
    expect(
      names([
        { label: "a", href: "/slots" },
        { label: "b", href: "/slots/2" },
        { label: "c", href: "/slots" },
      ]),
    ).toEqual(["slots", "slots-2", "slots-3"]);
  });
});
