// Iterative approach: accumulate values from 1 to n using a loop.
var sum_to_n_a = function (n) {
  if (n <= 0) return 0;

  let total = 0;
  for (let current = 1; current <= n; current += 1) {
    total += current;
  }

  return total;
};

// Recursive approach: sum n with the result of summing up to n - 1.
var sum_to_n_b = function (n) {
  if (n <= 0) return 0;

  return n + sum_to_n_b(n - 1);
};

// Mathematical approach: use arithmetic series formula n * (n + 1) / 2.
var sum_to_n_c = function (n) {
  if (n <= 0) return 0;

  const FIRST_TERM = 1;
  return ((FIRST_TERM + n) * n) / 2;
};


console.log(sum_to_n_a(5));
console.log(sum_to_n_b(5));
console.log(sum_to_n_c(5));