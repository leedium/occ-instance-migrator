<div  id="CC-prodDetails-addToCart" data-bind="inTabFlow:(validateAddToCart())" >
  <button id="cc-prodDetailsAddToCart" data-bind="disabled: {condition: !validateAddToCart() || isAddToCartClicked, click: handleAddToCart}" class="cc-button-primary">
    <!-- ko ifnot: stockState() === 'PREORDERABLE'-->
      <span id="cc-prodDetails-addToCart" data-bind="widgetLocaleText: 'addToCartText'"></span>
    <!-- /ko -->
    <!-- ko if: stockState() === 'PREORDERABLE'-->
      <span id="cc-prodDetails-addToCart" data-bind="widgetLocaleText: 'preOrderButtonText'"></span>
    <!-- /ko -->
  </button>
</div>
