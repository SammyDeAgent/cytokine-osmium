// //binary tree data structure
// function Node(data) {
//   this.data = data;
//   this.left = null;
//   this.right = null;
//   //print current node
//   this.print = function() {
//     return this.data;
//   }
// }

// var root = new Node('A');
// root.left = new Node('B');
// root.left.left = new Node('L');
// root.left.right = new Node('M');
// root.right = new Node('C');
// root.right.left = new Node('D');
// root.right.right = new Node('E');
// root.right.right.left = new Node('F');
// root.right.right.right = new Node('G');
// root.right.right.right.left = new Node('H');
// root.right.right.right.left.left = new Node('I');
// root.right.right.right.left.left.left = new Node('J');
// root.right.right.right.left.left.left.left = new Node('K');

// //convert binary tree to json object and print
// function convert(tree) {
//   var obj = {};
//   obj.data = tree.data;
//   if (tree.left) {
//     obj.left = convert(tree.left);
//   }
//   if (tree.right) {
//     obj.right = convert(tree.right);
//   }
//   return obj;
// }
// var json=convert(root);

// //print json object to console pretty
// console.log(JSON.stringify(json, null, 2));

//radix sort
function radixSort(array) {
  var max = array[0];
  for (var i = 1; i < array.length; i++) {
    if (array[i] > max) {
      max = array[i];
    }
  }
  var exp = 1;
  while (max / exp > 0) {
    var bucket = Array.apply(null, Array(10)).map(Number.prototype.valueOf, 0);
    for (var i = 0; i < array.length; i++) {
      var bucketIndex = Math.floor((array[i] / exp) % 10);
      bucket[bucketIndex]++;
    }
    for (var i = 1; i < 10; i++) {
      bucket[i] += bucket[i - 1];
    }
    var temp = Array.apply(null, Array(array.length)).map(Number.prototype.valueOf, 0);
    for (var i = array.length - 1; i >= 0; i--) {
      var bucketIndex = Math.floor((array[i] / exp) % 10);
      temp[--bucket[bucketIndex]] = array[i];
    }
    for (var i = 0; i < array.length; i++) {
      array[i] = temp[i];
    }
    exp *= 10;
  }
  return array;
}

//random generate a number array
function randomArray(length) {
  var array = [];
  for (var i = 0; i < length; i++) {
    array.push(Math.floor(Math.random() * length));
  }
  return array;
}

