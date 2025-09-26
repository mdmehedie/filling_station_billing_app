import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ColorTest() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Color Test - Primary Color: #059669</h2>
      
            {/* Buttons */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Buttons</h3>
                <div className="flex gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Progress Bars</h3>
                <div className="space-y-2">
                    <Progress value={25} />
                    <Progress value={50} />
                    <Progress value={75} />
                    <Progress value={100} />
                </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Primary Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This card uses the primary color scheme.</p>
                            <div className="mt-4">
                                <Badge>Primary Badge</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Secondary Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This card demonstrates secondary colors.</p>
                            <div className="mt-4">
                                <Badge variant="secondary">Secondary Badge</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Custom Color Classes */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Custom Color Classes</h3>
                <div className="flex gap-4">
                    <div className="bg-primary-custom text-white p-4 rounded">
                        Custom Primary Background
                    </div>
                    <div className="text-primary-custom p-4 border border-primary-custom rounded">
                        Custom Primary Text & Border
                    </div>
                </div>
            </div>
        </div>
    );
}
