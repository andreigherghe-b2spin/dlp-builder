import { afterEach } from "vitest";
import { cleanup } from "vitest-browser-react";

import "./vitest.css";

// One page serves every test in a file, so a carousel left mounted is a second
// carousel the next test can measure by accident — and they all look alike at the
// first slide, which is exactly the kind of cross-talk that passes until it
// doesn't. Unmount after each test.
afterEach(cleanup);
