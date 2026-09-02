---
slug: from-figma-to-verified-components
title: From Figma to Verified Components
description: "Translate design intent into tokens, a public API, Storybook, and test evidence instead of stopping at a similar screenshot."
date: "2026-08-29"
category: engineering
authors: ["YAMI Design System Team"]
tags: ["Figma", "Components", "Storybook", "Validation"]
relatedDocs: ["first-page", "create-components", "contribute-upstream"]
coverAlt: "YAMI Design System mark with the Engineering category"
draft: true
---

Delivering a component from Figma is often misunderstood as translating visuals into code. Visual fidelity matters, but a production component must also explain how props combine, how states appear, how keyboards operate it, how themes change, and how consumers know it is ready.

YAMI treats that work as an evidence chain. A screenshot is one input, not the final contract.

## Start with behavior and boundaries

Before implementation, define what the component owns and what it does not. Page structure, business data, and routing usually belong to applications. Interaction states, accessibility, and token bindings belong to the component.

Then inspect Catalog and Storybook. Reuse a public API when an existing component meets the task. When a real gap exists, define the smallest prop and state contract before copying or modifying code.

Record:

- Required and optional props.
- Default, hover, pressed, focus, disabled, and error states.
- Chinese, English, and long-content behavior.
- Light, dark, and inverse surface mapping.
- Structural changes across narrow and wide screens.

## Let tokens own visual decisions

Map Figma colors, spacing, radii, and typography to existing semantic tokens. If no value maps cleanly, do not write the closest CSS immediately. Determine whether the design diverges from guidance or the system truly lacks a reusable semantic.

Brand and operational reds must not be mixed through color sampling. Cards do not gain decorative borders or shadows, focus uses the shared outer outline, and disabled states do not lower the entire component's opacity.

These constraints allow one component to respond to theme and language instead of freezing each Figma frame into a separate branch.

## Storybook is an operable specification

Storybook shows more than the default appearance. It covers essential props, states, boundary content, and interaction steps so design and engineering can review the same running result.

Each component also needs metadata and usage guidance. Generated Catalog records its name, maturity, and public export; Registry records delivery dependencies. Only when these sources agree can applications and agents discover the component reliably.

## Verification extends beyond one screenshot

A verifiable component passes at least four layers:

1. Static: types, lint, public boundaries, and token validity.
2. Interaction: keyboard, focus, state changes, and event outcomes.
3. Visual: real rendering in Chinese and English, light and dark, and target breakpoints.
4. Integration: content order and business context inside a page composition.

Visual comparison checks structure, object count, copy, geometry, and critical states. Pixel differences can locate a problem but cannot prove an interaction. An HTTP 200 response does not prove the browser rendered correctly either.

## How agents participate

Agents can quickly read component docs, retrieve tokens, scaffold tests, and collect evidence. They follow the YAMI skill's reading order, limit change scope, and distinguish source facts, implementation observations, and hypotheses that still need verification.

When design and code sources conflict, an agent exposes the conflict instead of silently choosing one. It cannot infer brand-asset rights, component maturity, or production authorization.

The real finish line from Figma to code is not “looks similar.” It is design intent captured in a public contract that the next collaborator can verify again.
