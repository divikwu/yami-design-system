/**
 * Tabs.figma.tsx - Figma Code Connect binding.
 *
 * Maps the YAMI UI UX Guidelines Tabs component sets to the real compound
 * Tabs API. Figma splits Mobile/WEB and Primary Style A/B across separate
 * component sets; code keeps one YAMI component family and maps those axes
 * through TabsList props.
 */

import { figma } from "@figma/code-connect"

import { Tabs, TabsList, TabsTrigger } from "./Tabs"

const FIGMA_FILE = "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines"

function PrimaryStyleAExample({ inverse = false, skeleton = false }: { inverse?: boolean; skeleton?: boolean }) {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList variant="primary" styleVariant="a" inverse={inverse} skeleton={skeleton}>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3">Tab 3</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function PrimaryStyleBExample({ skeleton = false }: { skeleton?: boolean }) {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList variant="primary" styleVariant="b" skeleton={skeleton}>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3">Tab 3</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function SecondaryExample({ inverse = false, skeleton = false }: { inverse?: boolean; skeleton?: boolean }) {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList variant="secondary" inverse={inverse} skeleton={skeleton}>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3">Tab 3</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function TertiaryExample({ inverse = false }: { inverse?: boolean }) {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList variant="tertiary" inverse={inverse}>
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab-3">Tab 3</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

figma.connect(TabsList, `${FIGMA_FILE}?node-id=5631-135576`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <PrimaryStyleAExample skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=5651-136490`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <PrimaryStyleAExample inverse skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=6854-30602`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <PrimaryStyleBExample skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=5651-136681`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <SecondaryExample skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=5651-136703`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <SecondaryExample inverse skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=2737-24398`, {
  props: {},
  example: () => <TertiaryExample />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=2857-15324`, {
  props: {},
  example: () => <TertiaryExample inverse />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=3112-22784`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <PrimaryStyleAExample skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=3112-22821`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <PrimaryStyleAExample inverse skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=3112-22764`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <SecondaryExample skeleton={skeleton} />,
})

figma.connect(TabsList, `${FIGMA_FILE}?node-id=3112-22801`, {
  props: {
    skeleton: figma.enum("State", { Skeleton: true }),
  },
  example: ({ skeleton }) => <SecondaryExample inverse skeleton={skeleton} />,
})
