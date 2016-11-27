import React from 'react';

const TestDynamicClass = ({variable}) => (
	<div className='outer'>
		<div className='variable-wrapper'>
			<div className='without-variable'></div>
			<div className={`with-variable-${variable} and-another-${variable}`}></div>
		</div>
	</div>
);

export default TestDynamicClass;
