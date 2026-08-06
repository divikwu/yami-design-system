/**
 * Tabs - canonical examples.
 *
 * Keep every export aligned with meta.json `examples[]`.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs"

export const PrimaryTabsExample = () => (
  <section data-example="PrimaryTabsExample">
    <Tabs defaultValue="snacks">
      <TabsList variant="primary" styleVariant="a">
        <TabsTrigger value="snacks">Snacks</TabsTrigger>
        <TabsTrigger value="beauty">Beauty</TabsTrigger>
        <TabsTrigger value="grocery">Grocery</TabsTrigger>
      </TabsList>
      <TabsContent value="snacks">Snacks content</TabsContent>
      <TabsContent value="beauty">Beauty content</TabsContent>
      <TabsContent value="grocery">Grocery content</TabsContent>
    </Tabs>
  </section>
)

export const SegmentedTabsExample = () => (
  <section data-example="SegmentedTabsExample">
    <Tabs defaultValue="featured">
      <TabsList variant="primary" styleVariant="b">
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="new">New</TabsTrigger>
        <TabsTrigger value="sale">Sale</TabsTrigger>
      </TabsList>
      <TabsContent value="featured">Featured content</TabsContent>
      <TabsContent value="new">New content</TabsContent>
      <TabsContent value="sale">Sale content</TabsContent>
    </Tabs>
  </section>
)

export const SecondaryTabsExample = () => (
  <section data-example="SecondaryTabsExample">
    <Tabs defaultValue="orders">
      <TabsList variant="secondary">
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="returns">Returns</TabsTrigger>
        <TabsTrigger value="coupons">Coupons</TabsTrigger>
      </TabsList>
      <TabsContent value="orders">Orders content</TabsContent>
      <TabsContent value="returns">Returns content</TabsContent>
      <TabsContent value="coupons">Coupons content</TabsContent>
    </Tabs>
  </section>
)

export const TertiaryTabsExample = () => (
  <section data-example="TertiaryTabsExample">
    <Tabs defaultValue="all">
      <TabsList variant="tertiary">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
        <TabsTrigger value="local">Local</TabsTrigger>
      </TabsList>
      <TabsContent value="all">All content</TabsContent>
      <TabsContent value="popular">Popular content</TabsContent>
      <TabsContent value="local">Local content</TabsContent>
    </Tabs>
  </section>
)

export const InverseTabsExample = () => (
  <section
    data-example="InverseTabsExample"
    style={{
      background: "var(--surface-inverse)",
      padding: "var(--space-300)",
      borderRadius: "var(--radius-surface-default)",
      display: "inline-flex",
    }}
  >
    <Tabs defaultValue="snacks">
      <TabsList variant="tertiary" inverse>
        <TabsTrigger value="snacks">Snacks</TabsTrigger>
        <TabsTrigger value="beauty">Beauty</TabsTrigger>
        <TabsTrigger value="grocery">Grocery</TabsTrigger>
      </TabsList>
      <TabsContent value="snacks">Snacks content</TabsContent>
      <TabsContent value="beauty">Beauty content</TabsContent>
      <TabsContent value="grocery">Grocery content</TabsContent>
    </Tabs>
  </section>
)

export const DisabledTabsExample = () => (
  <section data-example="DisabledTabsExample">
    <Tabs defaultValue="available">
      <TabsList variant="primary" styleVariant="b">
        <TabsTrigger value="available">Available</TabsTrigger>
        <TabsTrigger value="coming-soon" disabled>
          Coming Soon
        </TabsTrigger>
      </TabsList>
      <TabsContent value="available">Available content</TabsContent>
      <TabsContent value="coming-soon">Coming soon content</TabsContent>
    </Tabs>
  </section>
)

export const SkeletonTabsExample = () => (
  <section data-example="SkeletonTabsExample">
    <Tabs defaultValue="loading">
      <TabsList variant="primary" styleVariant="a" skeleton aria-label="Loading tabs" />
    </Tabs>
  </section>
)
