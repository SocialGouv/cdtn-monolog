# Popularity

Stats defined in [popularity.js](src/analysis/popularity.js)
The report Popularity compute the evolution of unique page views compared with a reference.

The page views is normalized as % of the total content 
- normalize = #page_views/#Total_views_for_the_period
```js
{
  'focus_count': # of views of the page on the focus period
  'ref_count': # of views of the page on the reference period
  'diff': focus_norm_count - row.ref_norm_count (variation of % points between focus and ref)
  'abs_diff': abs(diff) (variation up or down)
}
```



